/** Angel One SmartAPI WebSocket — protocol types and constants */

// ── Subscription modes ────────────────────────────────────────────────────────

export const WS_MODE = {
  LTP: 1,        // Last Traded Price only  (51 bytes)
  QUOTE: 2,      // LTP + OHLC + volume     (123 bytes)
  SNAP_QUOTE: 3, // Quote + market depth    (339 bytes)
} as const;
export type WsMode = (typeof WS_MODE)[keyof typeof WS_MODE];

export const WS_ACTION = {
  UNSUBSCRIBE: 0,
  SUBSCRIBE: 1,
} as const;
export type WsAction = (typeof WS_ACTION)[keyof typeof WS_ACTION];

// ── Exchange types ────────────────────────────────────────────────────────────

export const EXCHANGE_TYPE = {
  NSE_CM: 1,
  NSE_FO: 2,
  BSE_CM: 3,
  BSE_FO: 4,
  MCX_FO: 5,
  NCX_FO: 7,
  CDE_FO: 13,
} as const;
export type ExchangeType = (typeof EXCHANGE_TYPE)[keyof typeof EXCHANGE_TYPE];

export const EXCHANGE_LABEL: Record<number, string> = {
  1: "NSE",
  2: "NFO",
  3: "BSE",
  4: "BFO",
  5: "MCX",
  7: "NCX",
  13: "CDS",
};

// ── Wire types ────────────────────────────────────────────────────────────────

export interface TokenGroup {
  exchangeType: ExchangeType;
  tokens: string[];
}

export interface WsSubscribeMessage {
  correlationID: string;
  action: WsAction;
  params: {
    mode: WsMode;
    tokenList: TokenGroup[];
  };
}

// ── Normalised tick (output of binary parser) ─────────────────────────────────

export interface DepthEntry {
  price: number;
  quantity: number;
}

export interface Tick {
  mode: WsMode;
  exchangeType: ExchangeType;
  token: string;
  sequenceNumber: number;
  exchangeTimestamp: number;    // Unix ms
  ltp: number;                  // ₹ Last traded price

  // Mode 2+ (Quote)
  lastTradedQty?: number;
  avgTradedPrice?: number;
  volumeTradedToday?: number;
  totalBuyQty?: number;
  totalSellQty?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;               // previous close — used to compute intraday change

  // Mode 3+ (SnapQuote)
  lastTradedTimestamp?: number;
  openInterest?: number;
  openInterestChangePct?: number;
  upperCircuit?: number;
  lowerCircuit?: number;
  week52High?: number;
  week52Low?: number;
  bestFiveBuy?: DepthEntry[];
  bestFiveSell?: DepthEntry[];
}

// ── Connection state ──────────────────────────────────────────────────────────

export type WsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "disconnected";

export interface SmartWsConfig {
  jwtToken: string;
  apiKey: string;
  clientCode: string;
  feedToken: string;
  /** Maximum reconnect attempts before giving up (default: 5) */
  maxReconnectAttempts?: number;
  /** Base delay in ms; doubles on each attempt (default: 1000) */
  reconnectDelayMs?: number;
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

export interface WatchlistItem {
  symbol: string;
  token: string;
  exchangeType: ExchangeType;
}

/** Default NSE watchlist — Angel One instrument token IDs */
export const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "RELIANCE",   token: "2885",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "TCS",        token: "11536", exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "HDFCBANK",   token: "1333",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "INFY",       token: "1594",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "ICICIBANK",  token: "4963",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "SBIN",       token: "3045",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "BHARTIARTL", token: "10604", exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "ITC",        token: "1660",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "KOTAKBANK",  token: "1922",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "WIPRO",      token: "3787",  exchangeType: EXCHANGE_TYPE.NSE_CM },
];
