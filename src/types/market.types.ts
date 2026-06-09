import type { AssetClass, TimeFrame } from "./common.types";

export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high24h: number;
  low24h: number;
  assetClass: AssetClass;
  logoUrl?: string;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDepth {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

export interface AISignal {
  id: string;
  symbol: string;
  signal: "buy" | "sell" | "hold";
  confidence: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: TimeFrame;
  reasoning: string;
  createdAt: string;
}

export interface MarketSentiment {
  symbol: string;
  overall: "bullish" | "bearish" | "neutral";
  score: number;
  fearGreedIndex: number;
  socialMentions: number;
  newsScore: number;
}
