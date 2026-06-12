import type { OHLCV } from "@/types/market.types";
import type { IndicatorPoint } from "@/types/indicators.types";
import { emaK } from "./utils";
import { initSMAState, nextSMA, type SMAState } from "./sma";

// ── Streaming state ────────────────────────────────────────────────────────────

export interface EMAState {
  period:    number;
  k:         number;
  lastEMA:   number | null;
  seeded:    boolean;
  seedState: SMAState; // accumulates first `period` values for SMA seed
}

export function initEMAState(period: number): EMAState {
  return {
    period,
    k:         emaK(period),
    lastEMA:   null,
    seeded:    false,
    seedState: initSMAState(period),
  };
}

/**
 * Feed one value (close price or any series) into the EMA state.
 * Seeds from SMA for the first `period` values, then applies Wilder/EMA smoothing.
 * Returns null until seeded.
 */
export function nextEMA(state: EMAState, value: number): number | null {
  if (!state.seeded) {
    const sma = nextSMA(state.seedState, value);
    if (sma === null) return null;
    // First EMA = SMA of the initial period values
    state.seeded  = true;
    state.lastEMA = sma;
    return sma;
  }
  const ema    = value * state.k + state.lastEMA! * (1 - state.k);
  state.lastEMA = ema;
  return ema;
}

// ── Batch calculation ──────────────────────────────────────────────────────────

export function calcEMA(candles: OHLCV[], period = 20): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  const state = initEMAState(period);
  for (const c of candles) {
    const v = nextEMA(state, c.close);
    if (v !== null) result.push({ timestamp: c.timestamp, value: v });
  }
  return result;
}
