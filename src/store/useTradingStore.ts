import { create } from "zustand";
import type { Order } from "@/types/trading.types";
import type { Ticker } from "@/types/market.types";

interface TradingStore {
  selectedSymbol: string;
  selectedTicker: Ticker | null;
  openOrders: Order[];
  isOrderPanelOpen: boolean;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedTicker: (ticker: Ticker | null) => void;
  setOpenOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  toggleOrderPanel: () => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  selectedSymbol: "BTCUSDT",
  selectedTicker: null,
  openOrders: [],
  isOrderPanelOpen: false,

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),

  setOpenOrders: (orders) => set({ openOrders: orders }),

  addOrder: (order) =>
    set((state) => ({
      openOrders: [order, ...state.openOrders],
    })),

  updateOrder: (order) =>
    set((state) => ({
      openOrders: state.openOrders.map((o) => (o.id === order.id ? order : o)),
    })),

  toggleOrderPanel: () => set((state) => ({ isOrderPanelOpen: !state.isOrderPanelOpen })),
}));
