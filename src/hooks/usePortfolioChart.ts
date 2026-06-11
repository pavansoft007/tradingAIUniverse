"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHoldings } from "@/hooks/usePortfolio";
import { getCandleData, candleDateRange } from "@/lib/api/angelone/market.api";
import { sessionUtil } from "@/lib/utils/session";
import type { AngelHolding } from "@/types/angel-portfolio.types";

export type ChartRange = "1W" | "1M" | "3M" | "6M" | "1Y";

const RANGE_DAYS: Record<ChartRange, number> = {
  "1W":  7,
  "1M":  30,
  "3M":  90,
  "6M":  180,
  "1Y":  365,
};

// Fetch candle data for all holdings in parallel and aggregate into daily portfolio value
async function fetchPortfolioHistory(
  holdings: AngelHolding[],
  days: number,
): Promise<{ x: number; y: number }[]> {
  const { fromdate, todate } = candleDateRange(days);

  const results = await Promise.allSettled(
    holdings.map((h) =>
      getCandleData({
        exchange:    h.exchange,
        symboltoken: h.symboltoken,
        interval:    "ONE_DAY",
        fromdate,
        todate,
      }),
    ),
  );

  // dateMs → totalPortfolioValue
  const dayMap = new Map<number, number>();

  results.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    const qty = holdings[i].quantity;
    result.value.forEach((bar) => {
      // Normalise to midnight timestamp for grouping
      const d = new Date(bar.timestamp);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      dayMap.set(key, (dayMap.get(key) ?? 0) + bar.close * qty);
    });
  });

  return [...dayMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([x, y]) => ({ x, y: Math.round(y) }));
}

export function usePortfolioChart(range: ChartRange) {
  const isAuth   = !!sessionUtil.loadJWT();
  const { data: holdingsData } = useHoldings();
  const holdings = useMemo(
    () => (holdingsData?.holdings ?? []).filter((h) => h.quantity > 0),
    [holdingsData],
  );

  const days = RANGE_DAYS[range];

  const { data: series = [], isLoading } = useQuery({
    queryKey:   ["portfolio", "chart", range, holdings.map((h) => h.symboltoken).join(",")],
    enabled:    isAuth && holdings.length > 0,
    queryFn:    () => fetchPortfolioHistory(holdings, days),
    staleTime:  5 * 60_000,   // cache 5 min — historical data doesn't change intra-day
    retry:      false,
  });

  const first     = series[0]?.y ?? 0;
  const last      = series[series.length - 1]?.y ?? 0;
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;

  return { series, isLoading, currentValue: last, changePct };
}
