// ── Batch calculators ──────────────────────────────────────────────────────────
export { calcSMA,       initSMAState,       nextSMA       } from "./sma";
export { calcEMA,       initEMAState,       nextEMA       } from "./ema";
export { calcRSI,       initRSIState,       nextRSI       } from "./rsi";
export { calcVWAP,      initVWAPState,      nextVWAP      } from "./vwap";
export { calcMACD,      initMACDState,      nextMACD      } from "./macd";
export { calcBollinger, initBollingerState, nextBollinger } from "./bollinger";

// ── Streaming engine ───────────────────────────────────────────────────────────
export { IndicatorEngine } from "./engine";

// ── ApexCharts utilities ───────────────────────────────────────────────────────
export {
  toApexLine,
  toApexCandlestick,
  toApexBollinger,
  toApexMACD,
  toApexOverlaySeries,
  TIMEFRAME_TO_INTERVAL,
  INTERVAL_MS,
} from "./apex";

// ── Shared streaming state types (needed by consumers who build custom engines) ─
export type { SMAState }       from "./sma";
export type { EMAState }       from "./ema";
export type { RSIState }       from "./rsi";
export type { VWAPState }      from "./vwap";
export type { MACDState }      from "./macd";
export type { BollingerState } from "./bollinger";
