import apiClient from "../client";
import { ENDPOINTS } from "../endpoints";
import type { PerformanceMetric, Portfolio, Position, Trade } from "@/types/portfolio.types";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common.types";

export const portfolioService = {
  getPortfolios: async (): Promise<ApiResponse<Portfolio[]>> => {
    const { data } = await apiClient.get(ENDPOINTS.portfolio.list);
    return data;
  },

  getPortfolio: async (id: string): Promise<ApiResponse<Portfolio>> => {
    const { data } = await apiClient.get(ENDPOINTS.portfolio.detail(id));
    return data;
  },

  getPositions: async (portfolioId: string): Promise<ApiResponse<Position[]>> => {
    const { data } = await apiClient.get(ENDPOINTS.portfolio.positions(portfolioId));
    return data;
  },

  getPerformance: async (portfolioId: string, period?: string): Promise<ApiResponse<PerformanceMetric[]>> => {
    const { data } = await apiClient.get(ENDPOINTS.portfolio.performance(portfolioId), {
      params: { period },
    });
    return data;
  },

  getTrades: async (params?: PaginationParams): Promise<PaginatedResponse<Trade>> => {
    const { data } = await apiClient.get(ENDPOINTS.portfolio.trades, { params });
    return data;
  },
};
