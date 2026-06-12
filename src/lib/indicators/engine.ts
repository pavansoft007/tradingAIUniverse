/**
 * IndicatorEngine — incremental, stateful wrapper around all indicator calculators.
 *
 * Performance model:
 *   constructor   O(N × I)   — batch warm-up over N candles × I indicators
 *   addCandle     O(I)       — O(1) per indicator via streaming state
 *   updateLastCandle O(I)    — O(1) per indicator via prevState snapshot
 *
 * The engine keeps a snapshot of state just before the last candle so that
 * a live price tick can recompute the last indicator point in O(1) without
 * touching any earlier values.
 */

import type { OHLCV } from "@/types/market.types";
import type {
  IndicatorsConfig,
  IndicatorResults,
  IndicatorPoint,
  MACDPoint,
  BollingerPoint,
  SMAConfig,
  EMAConfig,
  RSIConfig,
  VWAPConfig,
  MACDConfig,
  BollingerConfig,
} from "@/types/indicators.types";
import { deepClone } from "./utils";
import { initSMAState, nextSMA, type SMAState }             from "./sma";
import { initEMAState, nextEMA, type EMAState }             from "./ema";
import { initRSIState, nextRSI, type RSIState }             from "./rsi";
import { initVWAPState, nextVWAP, type VWAPState }          from "./vwap";
import { initMACDState, nextMACD, type MACDState }          from "./macd";
import { initBollingerState, nextBollinger, type BollingerState } from "./bollinger";

// ── Internal resolved config (all defaults applied, false → undefined) ─────────

interface ResolvedSMA       { period: number }
interface ResolvedEMA       { period: number }
interface ResolvedRSI       { period: number }
interface ResolvedVWAP      { resetDaily: boolean }
interface ResolvedMACD      { fast: number; slow: number; signal: number }
interface ResolvedBollinger { period: number; multiplier: number }

interface ResolvedConfig {
  sma?:       ResolvedSMA;
  ema?:       ResolvedEMA;
  rsi?:       ResolvedRSI;
  vwap?:      ResolvedVWAP;
  macd?:      ResolvedMACD;
  bollinger?: ResolvedBollinger;
}

function resolveConfig(cfg: IndicatorsConfig): ResolvedConfig {
  const sma       = (cfg.sma       as SMAConfig       | undefined);
  const ema       = (cfg.ema       as EMAConfig       | undefined);
  const rsi       = (cfg.rsi       as RSIConfig       | undefined);
  const vwap      = (cfg.vwap      as VWAPConfig      | undefined);
  const macd      = (cfg.macd      as MACDConfig      | undefined);
  const bollinger = (cfg.bollinger as BollingerConfig | undefined);
  return {
    sma:       cfg.sma       !== false ? { period:     sma?.period     ?? 20 }                                      : undefined,
    ema:       cfg.ema       !== false ? { period:     ema?.period     ?? 20 }                                      : undefined,
    rsi:       cfg.rsi       !== false ? { period:     rsi?.period     ?? 14 }                                      : undefined,
    vwap:      cfg.vwap      !== false ? { resetDaily: vwap?.resetDaily ?? true }                                   : undefined,
    macd:      cfg.macd      !== false ? { fast: macd?.fast ?? 12, slow: macd?.slow ?? 26, signal: macd?.signal ?? 9 } : undefined,
    bollinger: cfg.bollinger !== false ? { period: bollinger?.period ?? 20, multiplier: bollinger?.multiplier ?? 2 } : undefined,
  };
}

// ── Per-candle streaming states ────────────────────────────────────────────────

interface EngineStates {
  sma?:       SMAState;
  ema?:       EMAState;
  rsi?:       RSIState;
  vwap?:      VWAPState;
  macd?:      MACDState;
  bollinger?: BollingerState;
}

// ── Single-candle output (undefined = indicator not yet warmed up) ─────────────

interface PartialPoint {
  sma?:       IndicatorPoint;
  ema?:       IndicatorPoint;
  rsi?:       IndicatorPoint;
  vwap?:      IndicatorPoint;
  macd?:      MACDPoint;
  bollinger?: BollingerPoint;
}

// ── Engine ─────────────────────────────────────────────────────────────────────

export class IndicatorEngine {
  private readonly cfg: ResolvedConfig;
  private candles:   OHLCV[];
  private state:     EngineStates;
  private prevState: EngineStates; // snapshot before last candle
  private results:   IndicatorResults;

  constructor(candles: OHLCV[], config: IndicatorsConfig = {}) {
    this.cfg       = resolveConfig(config);
    this.candles   = [];
    this.state     = this.makeStates();
    this.prevState = this.makeStates();
    this.results   = {};

    // Warm up: batch process all historical candles
    for (const c of candles) this.addCandle(c);
  }

  /**
   * Append a completed candle.
   * Saves a prevState snapshot before processing so updateLastCandle can work.
   */
  addCandle(candle: OHLCV): IndicatorResults {
    this.prevState = deepClone(this.state);
    this.candles.push({ ...candle });
    const pt = this.computeOne(this.state, candle);
    this.apply(pt, false);
    return this.results;
  }

  /**
   * Update the current live candle's OHLCV without advancing to a new candle.
   * Uses the prevState snapshot to recompute the last indicator point in O(1).
   */
  updateLastCandle(close: number, high: number, low: number, volume: number): IndicatorResults {
    if (!this.candles.length) return this.results;
    const last    = this.candles[this.candles.length - 1];
    const updated = { ...last, close, high, low, volume };
    const tempState = deepClone(this.prevState);
    const pt = this.computeOne(tempState, updated);
    this.apply(pt, true /* replace last */);
    return this.results;
  }

  getResults(): IndicatorResults { return this.results; }
  getCandles(): readonly OHLCV[] { return this.candles; }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private makeStates(): EngineStates {
    const c = this.cfg;
    return {
      sma:       c.sma       ? initSMAState(c.sma.period)                                 : undefined,
      ema:       c.ema       ? initEMAState(c.ema.period)                                 : undefined,
      rsi:       c.rsi       ? initRSIState(c.rsi.period)                                 : undefined,
      vwap:      c.vwap      ? initVWAPState()                                             : undefined,
      macd:      c.macd      ? initMACDState(c.macd.fast, c.macd.slow, c.macd.signal)    : undefined,
      bollinger: c.bollinger ? initBollingerState(c.bollinger.period, c.bollinger.multiplier) : undefined,
    };
  }

  /** Run all enabled indicators against one candle. State is mutated in place. */
  private computeOne(state: EngineStates, candle: OHLCV): PartialPoint {
    const ts = candle.timestamp;
    const pt: PartialPoint = {};

    if (state.sma) {
      const v = nextSMA(state.sma, candle.close);
      if (v !== null) pt.sma = { timestamp: ts, value: v };
    }
    if (state.ema) {
      const v = nextEMA(state.ema, candle.close);
      if (v !== null) pt.ema = { timestamp: ts, value: v };
    }
    if (state.rsi) {
      const v = nextRSI(state.rsi, candle.close);
      if (v !== null) pt.rsi = { timestamp: ts, value: v };
    }
    if (state.vwap) {
      const v = nextVWAP(state.vwap, candle, this.cfg.vwap?.resetDaily);
      pt.vwap = { timestamp: ts, value: v };
    }
    if (state.macd) {
      const v = nextMACD(state.macd, candle.close);
      if (v !== null) pt.macd = { timestamp: ts, ...v };
    }
    if (state.bollinger) {
      const v = nextBollinger(state.bollinger, candle);
      if (v !== null) pt.bollinger = { timestamp: ts, ...v };
    }
    return pt;
  }

  /**
   * Append a new point or replace the last point for each indicator.
   * `replace = true` is used for live candle updates.
   */
  private apply(pt: PartialPoint, replace: boolean): void {
    const push = <T>(
      key: keyof IndicatorResults,
      point: T | undefined,
    ) => {
      if (point === undefined) return;
      const arr: T[] = ((this.results as Record<string, T[]>)[key as string] ??= []);
      if (replace && arr.length) {
        arr[arr.length - 1] = point;
      } else {
        arr.push(point);
      }
    };

    push<IndicatorPoint>("sma",       pt.sma);
    push<IndicatorPoint>("ema",       pt.ema);
    push<IndicatorPoint>("rsi",       pt.rsi);
    push<IndicatorPoint>("vwap",      pt.vwap);
    push<MACDPoint>     ("macd",      pt.macd);
    push<BollingerPoint>("bollinger", pt.bollinger);
  }
}
