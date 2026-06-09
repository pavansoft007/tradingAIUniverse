import { useQuery } from "@tanstack/react-query";
import { marketService } from "@/lib/api/services/market.service";
import type { TimeFrame } from "@/types/common.types";

export const MARKET_KEYS = {
  all: ["market"] as const,
  tickers: () => [...MARKET_KEYS.all, "tickers"] as const,
  ticker: (symbol: string) => [...MARKET_KEYS.all, "ticker", symbol] as const,
  ohlcv: (symbol: string, timeframe: TimeFrame) => [...MARKET_KEYS.all, "ohlcv", symbol, timeframe] as const,
  signals: () => [...MARKET_KEYS.all, "signals"] as const,
  signal: (symbol: string) => [...MARKET_KEYS.all, "signal", symbol] as const,
  sentiment: (symbol: string) => [...MARKET_KEYS.all, "sentiment", symbol] as const,
};

export function useTickers() {
  return useQuery({
    queryKey: MARKET_KEYS.tickers(),
    queryFn: () => marketService.getTickers(),
    refetchInterval: 10_000,
  });
}

export function useTicker(symbol: string) {
  return useQuery({
    queryKey: MARKET_KEYS.ticker(symbol),
    queryFn: () => marketService.getTicker(symbol),
    refetchInterval: 5_000,
    enabled: !!symbol,
  });
}

export function useOHLCV(symbol: string, timeframe: TimeFrame, limit?: number) {
  return useQuery({
    queryKey: MARKET_KEYS.ohlcv(symbol, timeframe),
    queryFn: () => marketService.getOHLCV(symbol, timeframe, limit),
    enabled: !!symbol,
  });
}

export function useAISignals() {
  return useQuery({
    queryKey: MARKET_KEYS.signals(),
    queryFn: () => marketService.getAISignals(),
    refetchInterval: 60_000,
  });
}

export function useAISignal(symbol: string) {
  return useQuery({
    queryKey: MARKET_KEYS.signal(symbol),
    queryFn: () => marketService.getAISignal(symbol),
    enabled: !!symbol,
  });
}

export function useMarketSentiment(symbol: string) {
  return useQuery({
    queryKey: MARKET_KEYS.sentiment(symbol),
    queryFn: () => marketService.getSentiment(symbol),
    enabled: !!symbol,
  });
}
