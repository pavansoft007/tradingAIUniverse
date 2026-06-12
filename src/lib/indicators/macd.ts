import type { OHLCV } from "@/types/market.types";
import type { MACDPoint } from "@/types/indicators.types";
import { initEMAState, nextEMA, type EMAState } from "./ema";

// ── Streaming state ────────────────────────────────────────────────────────────

export interface MACDState {
  fastState:   EMAState;
  slowState:   EMAState;
  signalState: EMAState; // seeded on MACD line values, not closes
}

export function initMACDState(fast = 12, slow = 26, signal = 9): MACDState {
  return {
    fastState:   initEMAState(fast),
    slowState:   initEMAState(slow),
    signalState: initEMAState(signal),
  };
}

/**
 * Feed one close price into the MACD state.
 *
 *   MACD line  = EMA(fast) - EMA(slow)
 *   Signal     = EMA(signal) applied to MACD line values
 *   Histogram  = MACD - Signal
 *
 * Returns null until all three values are available (warmup ≈ slow + signal candles).
 */
export function nextMACD(
  state: MACDState,
  close: number,
): Omit<MACDPoint, "timestamp"> | null {
  const fast = nextEMA(state.fastState, close);
  const slow = nextEMA(state.slowState, close);
  if (fast === null || slow === null) return null;

  const macdLine = fast - slow;

  const sig = nextEMA(state.signalState, macdLine);
  if (sig === null) return null;

  return { macd: macdLine, signal: sig, histogram: macdLine - sig };
}

// ── Batch calculation ──────────────────────────────────────────────────────────

export function calcMACD(
  candles: OHLCV[],
  fast    = 12,
  slow    = 26,
  signal  = 9,
): MACDPoint[] {
  const result: MACDPoint[] = [];
  const state = initMACDState(fast, slow, signal);
  for (const c of candles) {
    const v = nextMACD(state, c.close);
    if (v !== null) result.push({ timestamp: c.timestamp, ...v });
  }
  return result;
}
