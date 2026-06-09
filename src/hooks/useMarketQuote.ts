"use client";

import { useQuery } from "@tanstack/react-query";
import { getMarketQuote } from "@/lib/api/angelone/portfolio.api";
import { sessionUtil } from "@/lib/utils/session";
import type { AngelQuote } from "@/types/angel-portfolio.types";

export const QUOTE_KEYS = {
  single: (token: string) => ["angel", "quote", token] as const,
  multi:  (tokens: string[]) => ["angel", "quote", ...tokens.sort()] as const,
};

/** Fetches FULL quote (OHLCV + 5-level depth) for a single token. */
export function useMarketQuote(
  symbolToken: string,
  exchange: string = "NSE",
): { quote: AngelQuote | null; isLoading: boolean } {
  const isAuth = !!sessionUtil.loadJWT();

  const { data, isLoading } = useQuery({
    queryKey:        QUOTE_KEYS.single(symbolToken),
    enabled:         isAuth && !!symbolToken,
    queryFn:         () =>
      getMarketQuote({ mode: "FULL", exchangeTokens: { [exchange]: [symbolToken] } }),
    refetchInterval: 5_000,
    staleTime:       4_000,
    retry:           false,
  });

  return { quote: data?.[0] ?? null, isLoading };
}

/** Fetches LTP for multiple tokens at once (for summary rows, charts). */
export function useMultiQuote(
  tokens: { token: string; exchange: string }[],
): { quotes: AngelQuote[]; isLoading: boolean } {
  const isAuth = !!sessionUtil.loadJWT();
  const tokenIds = tokens.map((t) => t.token);

  // Group by exchange
  const byExchange = tokens.reduce<Record<string, string[]>>((acc, t) => {
    acc[t.exchange] = [...(acc[t.exchange] ?? []), t.token];
    return acc;
  }, {});

  const { data, isLoading } = useQuery({
    queryKey:        QUOTE_KEYS.multi(tokenIds),
    enabled:         isAuth && tokens.length > 0,
    queryFn:         () => getMarketQuote({ mode: "LTP", exchangeTokens: byExchange }),
    refetchInterval: 10_000,
    staleTime:       9_000,
    retry:           false,
  });

  return { quotes: data ?? [], isLoading };
}