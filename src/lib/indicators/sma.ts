import type { OHLCV } from "@/types/market.types";
import type { IndicatorPoint } from "@/types/indicators.types";

// ── Streaming state ────────────────────────────────────────────────────────────

export interface SMAState {
  period: number;
  values: number[]; // ring buffer of last N closes
  sum:    number;
}

export function initSMAState(period: number): SMAState {
  return { period, values: [], sum: 0 };
}

/**
 * Feed one close price into the rolling SMA state.
 * Returns the SMA value once `period` prices have been seen, otherwise null.
 */
export function nextSMA(state: SMAState, close: number): number | null {
  if (state.values.length >= state.period) {
    state.sum -= state.values.shift()!;
  }
  state.values.push(close);
  state.sum += close;
  if (state.values.length < state.period) return null;
  return state.sum / state.period;
}

// ── Batch calculation ──────────────────────────────────────────────────────────

export function calcSMA(candles: OHLCV[], period = 20): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  const state = initSMAState(period);
  for (const c of candles) {
    const v = nextSMA(state, c.close);
    if (v !== null) result.push({ timestamp: c.timestamp, value: v });
  }
  return result;
}
