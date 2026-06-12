import type { OHLCV } from "@/types/market.types";
import type { IndicatorPoint } from "@/types/indicators.types";

// ── Streaming state ────────────────────────────────────────────────────────────

export interface VWAPState {
  cumTPV: number;  // cumulative typical-price × volume
  cumVol: number;  // cumulative volume
  lastDay: number; // UTC day index of the last processed candle (for reset)
}

export function initVWAPState(): VWAPState {
  return { cumTPV: 0, cumVol: 0, lastDay: -1 };
}

/**
 * Feed one OHLCV candle into the VWAP state.
 *
 * Typical Price = (H + L + C) / 3
 * VWAP = Σ(TP × Volume) / ΣVolume
 *
 * When `resetDaily` is true (default), the running totals reset at midnight UTC —
 * matching intraday VWAP behaviour on most platforms.
 */
export function nextVWAP(
  state:      VWAPState,
  candle:     OHLCV,
  resetDaily = true,
): number {
  if (resetDaily) {
    const day = Math.floor(candle.timestamp / 86_400_000);
    if (day !== state.lastDay) {
      state.cumTPV = 0;
      state.cumVol = 0;
      state.lastDay = day;
    }
  }
  const tp     = (candle.high + candle.low + candle.close) / 3;
  state.cumTPV += tp * candle.volume;
  state.cumVol += candle.volume;
  // Guard against zero-volume sessions (e.g. index data)
  return state.cumVol === 0 ? candle.close : state.cumTPV / state.cumVol;
}

// ── Batch calculation ──────────────────────────────────────────────────────────

export function calcVWAP(candles: OHLCV[], resetDaily = true): IndicatorPoint[] {
  const state = initVWAPState();
  return candles.map((c) => ({
    timestamp: c.timestamp,
    value:     nextVWAP(state, c, resetDaily),
  }));
}
