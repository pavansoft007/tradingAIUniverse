import type { OHLCV } from "@/types/market.types";
import type { BollingerPoint } from "@/types/indicators.types";
import { stdDev } from "./utils";
import { initSMAState, nextSMA, type SMAState } from "./sma";

// ── Streaming state ────────────────────────────────────────────────────────────

export interface BollingerState {
  period:     number;
  multiplier: number;
  smaState:   SMAState;
  // smaState.values IS the rolling window for std dev — no separate buffer needed
}

export function initBollingerState(period = 20, multiplier = 2): BollingerState {
  return { period, multiplier, smaState: initSMAState(period) };
}

/**
 * Feed one OHLCV candle into the Bollinger Bands state.
 *
 *   Middle = SMA(period)
 *   σ      = population std dev of closes in the rolling window
 *   Upper  = Middle + multiplier × σ
 *   Lower  = Middle − multiplier × σ
 *
 * Returns null until `period` candles have been seen.
 */
export function nextBollinger(
  state:  BollingerState,
  candle: OHLCV,
): Omit<BollingerPoint, "timestamp"> | null {
  const middle = nextSMA(state.smaState, candle.close);
  if (middle === null) return null;

  // smaState.values now holds exactly `period` closes
  const sd = stdDev(state.smaState.values, middle);
  return {
    upper:  middle + state.multiplier * sd,
    middle,
    lower:  middle - state.multiplier * sd,
  };
}

// ── Batch calculation ──────────────────────────────────────────────────────────

export function calcBollinger(
  candles:    OHLCV[],
  period     = 20,
  multiplier = 2,
): BollingerPoint[] {
  const result: BollingerPoint[] = [];
  const state = initBollingerState(period, multiplier);
  for (const c of candles) {
    const v = nextBollinger(state, c);
    if (v !== null) result.push({ timestamp: c.timestamp, ...v });
  }
  return result;
}
