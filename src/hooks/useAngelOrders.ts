"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/lib/api/angelone/order.api";
import { executeOrder } from "@/lib/orders/executor";
import { useOrderStore } from "@/store/useOrderStore";
import { sessionUtil } from "@/lib/utils/session";
import type {
  AngelCancelOrderRequest,
  AngelModifyOrderRequest,
  OrderFormValues,
} from "@/types/angel-order.types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const ORDER_KEYS = {
  all:       ["angel", "orders"]  as const,
  book:      ["angel", "orders",  "book"]   as const,
  trades:    ["angel", "trades"]  as const,
  positions: ["angel", "positions"] as const,
} as const;

// ── Queries ───────────────────────────────────────────────────────────────────

/** Polls Angel One order book every 5 seconds. Only runs when authenticated. */
export function useOrderBook() {
  const setOrders = useOrderStore((s) => s.setOrders);
  const isAuth = !!sessionUtil.loadJWT();

  return useQuery({
    queryKey:  ORDER_KEYS.book,
    enabled:   isAuth,
    queryFn:   async () => {
      const orders = await orderApi.getOrderBook();
      setOrders(orders);
      return orders;
    },
    refetchInterval: 5_000,
    staleTime:       4_000,
    retry:           false,
  });
}

/** Polls executed trades every 10 s. Only runs when authenticated. */
export function useTradeBook() {
  const setTrades = useOrderStore((s) => s.setTrades);
  const isAuth = !!sessionUtil.loadJWT();

  return useQuery({
    queryKey: ORDER_KEYS.trades,
    enabled:  isAuth,
    queryFn:  async () => {
      const trades = await orderApi.getTradeBook();
      setTrades(trades);
      return trades;
    },
    refetchInterval: 10_000,
    staleTime:       9_000,
    retry:           false,
  });
}

/** Polls open positions every 5 seconds. Only runs when authenticated. */
export function usePositions() {
  const setPositions = useOrderStore((s) => s.setPositions);
  const isAuth = !!sessionUtil.loadJWT();

  return useQuery({
    queryKey: ORDER_KEYS.positions,
    enabled:  isAuth,
    queryFn:  async () => {
      const { net } = await orderApi.getPositions();
      setPositions(net);
      return net;
    },
    refetchInterval: 5_000,
    staleTime:       4_000,
    retry:           false,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Place a new order (with retry logic baked in via executeOrder). */
export function usePlaceOrder() {
  const qc = useQueryClient();
  const { setPlacing, setPlacingError, pushNotif } = useOrderStore();

  return useMutation({
    mutationFn: (values: OrderFormValues) => {
      setPlacing(true);
      setPlacingError(null);
      return executeOrder(values);
    },

    onSuccess: (result) => {
      setPlacing(false);
      pushNotif(
        "success",
        "Order Placed",
        `${result.script} · Order ID ${result.orderid}`,
        result.orderid,
      );
      // Refresh order book immediately
      qc.invalidateQueries({ queryKey: ORDER_KEYS.book });
    },

    onError: (err: Error) => {
      setPlacing(false);
      const msg = err.message || "Order placement failed";
      setPlacingError(msg);
      pushNotif("error", "Order Failed", msg);
    },
  });
}

/** Modify an existing open/pending order. */
export function useModifyOrder() {
  const qc = useQueryClient();
  const { pushNotif } = useOrderStore();

  return useMutation({
    mutationFn: (payload: AngelModifyOrderRequest) => orderApi.modifyOrder(payload),

    onSuccess: (result) => {
      pushNotif("info", "Order Modified", `Order ID ${result.orderid}`, result.orderid);
      qc.invalidateQueries({ queryKey: ORDER_KEYS.book });
    },

    onError: (err: Error) => {
      pushNotif("error", "Modify Failed", err.message || "Could not modify order");
    },
  });
}

/** Cancel an open/pending order. */
export function useCancelOrder() {
  const qc = useQueryClient();
  const { pushNotif } = useOrderStore();

  return useMutation({
    mutationFn: (payload: AngelCancelOrderRequest) => orderApi.cancelOrder(payload),

    onSuccess: (result) => {
      pushNotif("warning", "Order Cancelled", `Order ID ${result.orderid}`, result.orderid);
      qc.invalidateQueries({ queryKey: ORDER_KEYS.book });
    },

    onError: (err: Error) => {
      pushNotif("error", "Cancel Failed", err.message || "Could not cancel order");
    },
  });
}
