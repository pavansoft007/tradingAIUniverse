import { useQuery } from "@tanstack/react-query";
import { portfolioService } from "@/lib/api/services/portfolio.service";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export const PORTFOLIO_KEYS = {
  all: ["portfolio"] as const,
  list: () => [...PORTFOLIO_KEYS.all, "list"] as const,
  detail: (id: string) => [...PORTFOLIO_KEYS.all, "detail", id] as const,
  positions: (id: string) => [...PORTFOLIO_KEYS.all, "positions", id] as const,
  performance: (id: string, period?: string) => [...PORTFOLIO_KEYS.all, "performance", id, period] as const,
  trades: (page?: number) => [...PORTFOLIO_KEYS.all, "trades", page] as const,
};

export function usePortfolios() {
  const { setPortfolios } = usePortfolioStore();
  return useQuery({
    queryKey: PORTFOLIO_KEYS.list(),
    queryFn: async () => {
      const res = await portfolioService.getPortfolios();
      setPortfolios(res.data);
      return res;
    },
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.detail(id),
    queryFn: () => portfolioService.getPortfolio(id),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

export function usePositions(portfolioId: string) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.positions(portfolioId),
    queryFn: () => portfolioService.getPositions(portfolioId),
    enabled: !!portfolioId,
    refetchInterval: 15_000,
  });
}

export function usePerformance(portfolioId: string, period?: string) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.performance(portfolioId, period),
    queryFn: () => portfolioService.getPerformance(portfolioId, period),
    enabled: !!portfolioId,
  });
}

export function useTrades(page = 1, limit = 20) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.trades(page),
    queryFn: () => portfolioService.getTrades({ page, limit }),
  });
}
