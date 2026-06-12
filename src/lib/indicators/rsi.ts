import type { OHLCV } from "@/types/market.types";
import type { IndicatorPoint } from "@/types/indicators.types";
import { clamp } from "./utils";

// ── Streaming state ────────────────────────────────────────────────────────────

export interface RSIState {
  period:    number;
  prevClose: number | null;
  avgGain:   number | null;
  avgLoss:   number | null;
  // seed buffers — discarded after initial period
  gains:     number[];
  losses:    number[];
}

export function initRSIState(period: number): RSIState {
  return {
    period,
    prevClose: null,
    avgGain:   null,
    avgLoss:   null,
    gains:     [],
    losses:    [],
  };
}

/**
 * Feed one close into the RSI state.
 *
 * Uses Wilder's smoothing (RMA):
 *   seed: avgGain/avgLoss = simple mean of first `period` changes
 *   subsequent: avgGain = (avgGain × (period-1) + gain) / period
 *
 * Returns null for the first `period + 1` prices.
 */
export function nextRSI(state: RSIState, close: number): number | null {
  if (state.prevClose === null) {
    state.prevClose = close;
    return null;
  }

  const delta = close - state.prevClose;
  state.prevClose = close;
  const gain = Math.max(delta, 0);
  const loss = Math.max(-delta, 0);

  if (state.avgGain === null) {
    // Still accumulating seed data
    state.gains.push(gain);
    state.losses.push(loss);
    if (state.gains.length < state.period) return null;

    // Seed: simple average of first period changes
    state.avgGain = state.gains.reduce((s, v) => s + v, 0) / state.period;
    state.avgLoss = state.losses.reduce((s, v) => s + v, 0) / state.period;
    // Free seed buffers
    state.gains  = [];
    state.losses = [];
  } else {
    // Wilder's smoothing
    state.avgGain = (state.avgGain * (state.period - 1) + gain) / state.period;
    state.avgLoss = (state.avgLoss! * (state.period - 1) + loss) / state.period;
  }

  if (state.avgLoss === 0 && state.avgGain === 0) return 50;
  if (state.avgLoss === 0) return 100;

  const rs = state.avgGain / state.avgLoss!;
  return clamp(100 - 100 / (1 + rs), 0, 100);
}

// ── Batch calculation ──────────────────────────────────────────────────────────

export function calcRSI(candles: OHLCV[], period = 14): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  const state = initRSIState(period);
  for (const c of candles) {
    const v = nextRSI(state, c.close);
    if (v !== null) result.push({ timestamp: c.timestamp, value: v });
  }
  return result;
}
