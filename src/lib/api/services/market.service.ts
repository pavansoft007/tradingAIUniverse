import apiClient from "../client";
import { ENDPOINTS } from "../endpoints";
import type { AISignal, MarketDepth, MarketSentiment, OHLCV, Ticker } from "@/types/market.types";
import type { ApiResponse, PaginatedResponse, TimeFrame } from "@/types/common.types";

export const marketService = {
  getTickers: async (): Promise<PaginatedResponse<Ticker>> => {
    const { data } = await apiClient.get(ENDPOINTS.market.tickers);
    return data;
  },

  getTicker: async (symbol: string): Promise<ApiResponse<Ticker>> => {
    const { data } = await apiClient.get(ENDPOINTS.market.ticker(symbol));
    return data;
  },

  getOHLCV: async (symbol: string, timeframe: TimeFrame, limit?: number): Promise<ApiResponse<OHLCV[]>> => {
    const { data } = await apiClient.get(ENDPOINTS.market.ohlcv(symbol), {
      params: { timeframe, limit },
    });
    return data;
  },

  getMarketDepth: async (symbol: string): Promise<ApiResponse<MarketDepth>> => {
    const { data } = await apiClient.get(ENDPOINTS.market.depth(symbol));
    return data;
  },

  getAISignals: async (): Promise<PaginatedResponse<AISignal>> => {
    const { data } = await apiClient.get(ENDPOINTS.market.signals);
    return data;
  },

  getAISignal: async (symbol: string): Promise<ApiResponse<AISignal>> => {
    const { data } = await apiClient.get(ENDPOINTS.market.signal(symbol));
    return data;
  },

  getSentiment: async (symbol: string): Promise<ApiResponse<MarketSentiment>> => {
    const { data } = await apiClient.get(ENDPOINTS.market.sentiment(symbol));
    return data;
  },

  search: async (query: string): Promise<ApiResponse<Ticker[]>> => {
    const { data } = await apiClient.get(ENDPOINTS.market.search, { params: { q: query } });
    return data;
  },
};
