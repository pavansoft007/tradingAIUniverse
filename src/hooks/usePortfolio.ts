"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFunds, getHoldings, getMarketQuote } from "@/lib/api/angelone/portfolio.api";
import { sessionUtil } from "@/lib/utils/session";
import { EXCHANGE_TYPE } from "@/types/smartws.types";
import type { PositionItem } from "@/components/features/portfolio/LivePositionsTable";

export const PORTFOLIO_KEYS = {
  holdings:  ["angel", "portfolio", "holdings"]   as const,
  funds:     ["angel", "portfolio", "funds"]      as const,
  liveLtp:   ["angel", "portfolio", "live-ltp"]   as const,
};

export function useHoldings() {
  const isAuth = !!sessionUtil.loadJWT();
  return useQuery({
    queryKey:        PORTFOLIO_KEYS.holdings,
    enabled:         isAuth,
    queryFn:         getHoldings,
    refetchInterval: 30_000,
    staleTime:       25_000,
    retry:           false,
  });
}

export function useFunds() {
  const isAuth = !!sessionUtil.loadJWT();
  return useQuery({
    queryKey:        PORTFOLIO_KEYS.funds,
    enabled:         isAuth,
    queryFn:         getFunds,
    refetchInterval: 30_000,
    staleTime:       25_000,
    retry:           false,
  });
}

// ── Live LTP via REST polling ─────────────────────────────────────────────────
// getMarketQuote is polled every 3 s so the portfolio P&L stays current even
// when the WebSocket stream isn't delivering ticks.

function useLivePortfolioLTP(
  nseTokens: string[],
  bseTokens: string[],
): Map<string, number> {
  const isAuth = !!sessionUtil.loadJWT();
  const hasTokens = nseTokens.length > 0 || bseTokens.length > 0;

  const { data } = useQuery({
    queryKey:        [...PORTFOLIO_KEYS.liveLtp, nseTokens.join(","), bseTokens.join(",")],
    enabled:         isAuth && hasTokens,
    queryFn:         () =>
      getMarketQuote({
        mode: "LTP",
        exchangeTokens: {
          ...(nseTokens.length > 0 ? { NSE: nseTokens } : {}),
          ...(bseTokens.length > 0 ? { BSE: bseTokens } : {}),
        },
      }),
    refetchInterval: 3_000,   // poll every 3 seconds for live P&L
    staleTime:       2_000,
    retry:           false,
  });

  return useMemo(() => {
    const map = new Map<string, number>();
    data?.forEach((q) => {
      if (q.ltp) map.set(q.symbolToken, q.ltp);
    });
    return map;
  }, [data]);
}

// ── Holdings → PositionItem[] ─────────────────────────────────────────────────

export function useHoldingsAsPositions(): {
  positions:  PositionItem[];
  totalValue: number;
  isLoading:  boolean;
} {
  const { data: holdingsData, isLoading } = useHoldings();
  const holdings     = holdingsData?.holdings     ?? [];
  const totalHolding = holdingsData?.totalholding;

  // Build token lists per exchange for the LTP poller
  const nseTokens = useMemo(
    () => holdings.filter((h) => h.quantity > 0 && h.exchange !== "BSE").map((h) => h.symboltoken),
    [holdings],
  );
  const bseTokens = useMemo(
    () => holdings.filter((h) => h.quantity > 0 && h.exchange === "BSE").map((h) => h.symboltoken),
    [holdings],
  );

  const ltpMap = useLivePortfolioLTP(nseTokens, bseTokens);

  const positions = useMemo<PositionItem[]>(() => {
    if (!holdings.length) return [];
    const totalValue = totalHolding?.totalholdingvalue ?? 1;

    return holdings
      .filter((h) => h.quantity > 0)
      .map((h) => {
        // Priority: live REST LTP → API close price → average price
        const liveLtp  = ltpMap.get(h.symboltoken);
        const ltp      = liveLtp ?? h.close ?? h.averageprice;
        const curValue = ltp * h.quantity;   // for allocation % calculation
        const alloc    = totalValue > 0 ? (curValue / totalValue) * 100 : 0;
        const symbol   = h.tradingsymbol.replace(/-EQ$|-BE$|-N$|-Z$/, "");

        // P&L calculated from live LTP when available; otherwise use API P&L
        const apiPnl    = liveLtp != null
          ? (liveLtp - h.averageprice) * h.quantity
          : h.profitandloss;
        const apiPnlPct = liveLtp != null && h.averageprice > 0
          ? ((liveLtp - h.averageprice) / h.averageprice) * 100
          : h.pnlpercentage;

        return {
          symbol,
          name:         symbol,
          token:        h.symboltoken,
          exchangeType: h.exchange === "BSE" ? EXCHANGE_TYPE.BSE_CM : EXCHANGE_TYPE.NSE_CM,
          qty:          h.quantity,
          avgEntry:     h.averageprice,
          prevClose:    h.close || h.averageprice,   // previous day close for PriceCell colour
          livePrice:    ltp,                          // freshest price (REST poll or close)
          apiPnl,
          apiPnlPct,
          alloc:        Math.round(alloc * 10) / 10,
        } satisfies PositionItem;
      });
  }, [holdings, totalHolding, ltpMap]);

  return {
    positions,
    totalValue: totalHolding?.totalholdingvalue ?? 0,
    isLoading,
  };
}
