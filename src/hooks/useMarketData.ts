import { useQuery } from "@tanstack/react-query";
import { marketService } from "@/lib/api/services/market.service";
import type { TimeFrame } from "@/types/common.types";

export const MARKET_KEYS = {
  all:       ["market"] as const,
  tickers:   () => [...MARKET_KEYS.all, "tickers"] as const,
  ticker:    (symbol: string) => [...MARKET_KEYS.all, "ticker", symbol] as const,
  ohlcv:     (symbol: string, tf: TimeFrame) => [...MARKET_KEYS.all, "ohlcv", symbol, tf] as const,
  signals:   () => [...MARKET_KEYS.all, "signals"] as const,
  signal:    (symbol: string) => [...MARKET_KEYS.all, "signal", symbol] as const,
  sentiment: (symbol: string) => [...MARKET_KEYS.all, "sentiment", symbol] as const,
};

/** Shared defaults — stop flooding the network when the backend is offline */
const BASE_OPTIONS = {
  retry:                  0,
  retryOnMount:           false,
  refetchOnWindowFocus:   false,
  refetchOnReconnect:     false,
} as const;

export function useTickers() {
  return useQuery({
    ...BASE_OPTIONS,
    queryKey:        MARKET_KEYS.tickers(),
    queryFn:         () => marketService.getTickers(),
    // Only poll when the last fetch succeeded — stop hammering a dead backend
    refetchInterval: (query) => (query.state.status === "success" ? 15_000 : false),
  });
}

export function useTicker(symbol: string) {
  return useQuery({
    ...BASE_OPTIONS,
    queryKey:        MARKET_KEYS.ticker(symbol),
    queryFn:         () => marketService.getTicker(symbol),
    refetchInterval: (query) => (query.state.status === "success" ? 10_000 : false),
    enabled:         !!symbol,
  });
}

export function useOHLCV(symbol: string, timeframe: TimeFrame, limit?: number) {
  return useQuery({
    ...BASE_OPTIONS,
    queryKey: MARKET_KEYS.ohlcv(symbol, timeframe),
    queryFn:  () => marketService.getOHLCV(symbol, timeframe, limit),
    enabled:  !!symbol,
  });
}

export function useAISignals() {
  return useQuery({
    ...BASE_OPTIONS,
    queryKey:        MARKET_KEYS.signals(),
    queryFn:         () => marketService.getAISignals(),
    refetchInterval: (query) => (query.state.status === "success" ? 60_000 : false),
  });
}

export function useAISignal(symbol: string) {
  return useQuery({
    ...BASE_OPTIONS,
    queryKey: MARKET_KEYS.signal(symbol),
    queryFn:  () => marketService.getAISignal(symbol),
    enabled:  !!symbol,
  });
}

export function useMarketSentiment(symbol: string) {
  return useQuery({
    ...BASE_OPTIONS,
    queryKey: MARKET_KEYS.sentiment(symbol),
    queryFn:  () => marketService.getSentiment(symbol),
    enabled:  !!symbol,
  });
}
