"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFunds, getHoldings } from "@/lib/api/angelone/portfolio.api";
import { sessionUtil } from "@/lib/utils/session";
import { EXCHANGE_TYPE } from "@/types/smartws.types";
import type { PositionItem } from "@/components/features/portfolio/LivePositionsTable";

export const PORTFOLIO_KEYS = {
  holdings: ["angel", "portfolio", "holdings"] as const,
  funds:    ["angel", "portfolio", "funds"]    as const,
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

export function useHoldingsAsPositions(): {
  positions: PositionItem[];
  totalValue: number;
  isLoading:  boolean;
} {
  const { data: holdingsData, isLoading } = useHoldings();
  const holdings     = holdingsData?.holdings     ?? [];
  const totalHolding = holdingsData?.totalholding;

  const positions = useMemo<PositionItem[]>(() => {
    if (!holdings.length) return [];
    const totalValue = totalHolding?.totalholdingvalue ?? 1;

    return holdings
      .filter((h) => h.quantity > 0)
      .map((h) => {
        const curValue = (h.close || h.averageprice) * h.quantity;
        const alloc    = totalValue > 0 ? (curValue / totalValue) * 100 : 0;
        const symbol   = h.tradingsymbol.replace(/-EQ$|-BE$|-N$|-Z$/, "");

        return {
          symbol,
          name:         symbol,
          token:        h.symboltoken,
          exchangeType: h.exchange === "BSE" ? EXCHANGE_TYPE.BSE_CM : EXCHANGE_TYPE.NSE_CM,
          qty:          h.quantity,
          avgEntry:     h.averageprice,
          alloc:        Math.round(alloc * 10) / 10,
        } satisfies PositionItem;
      });
  }, [holdings, totalHolding]);

  return {
    positions,
    totalValue: totalHolding?.totalholdingvalue ?? 0,
    isLoading,
  };
}