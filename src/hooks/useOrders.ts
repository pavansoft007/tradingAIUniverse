import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tradingService } from "@/lib/api/services/trading.service";
import { useTradingStore } from "@/store/useTradingStore";
import type { CreateOrderPayload } from "@/types/trading.types";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  list: (page?: number) => [...ORDER_KEYS.all, "list", page] as const,
  watchlist: () => [...ORDER_KEYS.all, "watchlist"] as const,
  alerts: () => [...ORDER_KEYS.all, "alerts"] as const,
};

export function useOrders(page = 1, limit = 20) {
  return useQuery({
    queryKey: ORDER_KEYS.list(page),
    queryFn: () => tradingService.getOrders({ page, limit }),
    refetchInterval: 10_000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { addOrder } = useTradingStore();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => tradingService.createOrder(payload),
    onSuccess: (res) => {
      addOrder(res.data);
      void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tradingService.cancelOrder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useWatchlist() {
  return useQuery({
    queryKey: ORDER_KEYS.watchlist(),
    queryFn: () => tradingService.getWatchlist(),
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ORDER_KEYS.alerts(),
    queryFn: () => tradingService.getAlerts(),
  });
}
