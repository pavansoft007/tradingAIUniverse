import apiClient from "../client";
import { ENDPOINTS } from "../endpoints";
import type { Alert, CreateOrderPayload, Order, WatchlistItem } from "@/types/trading.types";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common.types";

export const tradingService = {
  getOrders: async (params?: PaginationParams): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get(ENDPOINTS.trading.orders, { params });
    return data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<ApiResponse<Order>> => {
    const { data } = await apiClient.post(ENDPOINTS.trading.orders, payload);
    return data;
  },

  cancelOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const { data } = await apiClient.post(ENDPOINTS.trading.cancel(id));
    return data;
  },

  getWatchlist: async (): Promise<ApiResponse<WatchlistItem[]>> => {
    const { data } = await apiClient.get(ENDPOINTS.trading.watchlist);
    return data;
  },

  addToWatchlist: async (symbol: string): Promise<ApiResponse<WatchlistItem>> => {
    const { data } = await apiClient.post(ENDPOINTS.trading.watchlist, { symbol });
    return data;
  },

  removeFromWatchlist: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(ENDPOINTS.trading.watchlistItem(id));
    return data;
  },

  getAlerts: async (): Promise<ApiResponse<Alert[]>> => {
    const { data } = await apiClient.get(ENDPOINTS.trading.alerts);
    return data;
  },

  createAlert: async (payload: Omit<Alert, "id" | "createdAt" | "triggeredAt">): Promise<ApiResponse<Alert>> => {
    const { data } = await apiClient.post(ENDPOINTS.trading.alerts, payload);
    return data;
  },

  deleteAlert: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(ENDPOINTS.trading.alert(id));
    return data;
  },
};
