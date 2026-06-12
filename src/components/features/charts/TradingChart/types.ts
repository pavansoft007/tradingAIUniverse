import type { CandleInterval } from "@/lib/api/angelone/market.api";
import type { ExchangeType } from "@/types/smartws.types";

// ── Public props ───────────────────────────────────────────────────────────────

export interface TradingChartProps {
  /** Display name shown in the toolbar */
  title?:         string;
  /** Angel One exchange string, e.g. "NSE" */
  exchange:       string;
  /** Angel One symbol token, e.g. "2885" */
  symboltoken:    string;
  /** WebSocket exchange type for real-time tick subscription */
  exchangeType:   ExchangeType;
  /** Height of the main candlestick panel in px (default 400) */
  mainHeight?:    number;
  /** Enable real-time WebSocket tick updates (default true) */
  realtime?:      boolean;
}

// ── Crosshair / legend data ────────────────────────────────────────────────────

export interface LegendData {
  timestamp: number;   // ms
  open:      number;
  high:      number;
  low:       number;
  close:     number;
  volume:    number;
  change:    number;   // close - prevClose
  changePct: number;
  sma?:      number | null;
  ema?:      number | null;
  vwap?:     number | null;
  bbUpper?:  number | null;
  bbLower?:  number | null;
  rsi?:      number | null;
  macd?:     number | null;
  signal?:   number | null;
  histogram?: number | null;
}

// ── Timeframe display config ───────────────────────────────────────────────────

export interface TimeframeOption {
  label:    string;
  interval: CandleInterval;
  daysBack: number;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: "1m",  interval: "ONE_MINUTE",     daysBack: 3   },
  { label: "5m",  interval: "FIVE_MINUTE",    daysBack: 7   },
  { label: "15m", interval: "FIFTEEN_MINUTE", daysBack: 15  },
  { label: "30m", interval: "THIRTY_MINUTE",  daysBack: 20  },
  { label: "1h",  interval: "ONE_HOUR",       daysBack: 60  },
  { label: "1d",  interval: "ONE_DAY",        daysBack: 365 },
];

// ── Chart geometry constants ───────────────────────────────────────────────────

export const RSI_PANE_HEIGHT  = 130;
export const MACD_PANE_HEIGHT = 140;

// ── Indicator color palette (theme-agnostic, works on dark + light) ────────────

export const CHART_COLORS = {
  upCandle:   "#26a69a",
  downCandle: "#ef5350",
  upVolume:   "rgba(38,166,154,0.45)",
  downVolume: "rgba(239,83,80,0.45)",

  sma:      "#f59e0b",
  ema:      "#a78bfa",
  vwap:     "#22d3ee",
  bbBand:   "#6366f1",

  rsi:      "#fb923c",
  rsi70:    "#f87171",
  rsi30:    "#4ade80",

  macdLine: "#60a5fa",
  macdSig:  "#f472b6",
  histUp:   "rgba(74,222,128,0.75)",
  histDown: "rgba(248,113,113,0.75)",
} as const;
