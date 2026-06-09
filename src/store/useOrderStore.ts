"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  AngelOrder,
  AngelPosition,
  AngelTrade,
  OrderNotification,
  OrderNotifType,
} from "@/types/angel-order.types";

// ── Notification helpers ──────────────────────────────────────────────────────

const NOTIF_TTL_MS = 5_000;

function makeNotif(
  type: OrderNotifType,
  title: string,
  message: string,
  orderId?: string,
): OrderNotification {
  return {
    id:        `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    message,
    orderId,
    createdAt: Date.now(),
  };
}

// ── Store interface ───────────────────────────────────────────────────────────

interface OrderStore {
  // Server-side lists (populated by TanStack Query, stored here for components
  // that need cross-tab access without re-fetching)
  orders:       AngelOrder[];
  trades:       AngelTrade[];
  positions:    AngelPosition[];

  // In-flight state for the active order form
  isPlacing:    boolean;
  placingError: string | null;

  // Toast notifications
  notifications: OrderNotification[];

  // ── Setters (called by TanStack Query hooks) ──────────────────────────────
  setOrders:    (orders: AngelOrder[])       => void;
  setTrades:    (trades: AngelTrade[])       => void;
  setPositions: (positions: AngelPosition[]) => void;
  setPlacing:   (v: boolean)                 => void;
  setPlacingError: (msg: string | null)      => void;

  // ── Notification API ──────────────────────────────────────────────────────
  pushNotif: (
    type: OrderNotifType,
    title: string,
    message: string,
    orderId?: string,
  ) => void;
  dismissNotif: (id: string) => void;
  clearNotifs:  () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useOrderStore = create<OrderStore>()(
  devtools(
    (set) => ({
      orders:       [],
      trades:       [],
      positions:    [],
      isPlacing:    false,
      placingError: null,
      notifications: [],

      setOrders:    (orders)    => set({ orders }),
      setTrades:    (trades)    => set({ trades }),
      setPositions: (positions) => set({ positions }),
      setPlacing:   (isPlacing) => set({ isPlacing }),
      setPlacingError: (placingError) => set({ placingError }),

      pushNotif: (type, title, message, orderId) =>
        set((state) => {
          const notif = makeNotif(type, title, message, orderId);
          // Auto-dismiss after TTL
          if (typeof window !== "undefined") {
            setTimeout(() => {
              useOrderStore.getState().dismissNotif(notif.id);
            }, NOTIF_TTL_MS);
          }
          return { notifications: [...state.notifications, notif] };
        }),

      dismissNotif: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifs: () => set({ notifications: [] }),
    }),
    { name: "OrderStore" },
  ),
);

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectOpenOrders = (s: OrderStore) =>
  s.orders.filter((o) =>
    ["open", "pending", "trigger pending", "AMO REQ RECEIVED"].includes(o.status),
  );

export const selectFilledOrders = (s: OrderStore) =>
  s.orders.filter((o) => o.status === "complete");

export const selectNetPositions = (s: OrderStore) =>
  s.positions.filter((p) => parseInt(p.netqty, 10) !== 0);
