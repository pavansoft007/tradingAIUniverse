/**
 * Market data store — bridges the SmartWebSocket singleton to React state.
 *
 * Subscription ref-counting:
 *   subscribe(token, exchange, mode)  → refCount 0→1: sends SUBSCRIBE to WS
 *   unsubscribe(token, exchange)      → refCount 1→0: sends UNSUBSCRIBE to WS
 *
 * Ticks are stored as a plain Record (not Map) for Zustand shallow-equality.
 * Key format: `${exchangeType}_${token}`  e.g. "1_2885"
 */

import { create } from "zustand";
import { smartWs } from "@/lib/ws/SmartWebSocket";
import type {
  ExchangeType,
  SmartWsConfig,
  Tick,
  WatchlistItem,
  WsConnectionStatus,
  WsMode,
} from "@/types/smartws.types";
import { DEFAULT_WATCHLIST, WS_MODE } from "@/types/smartws.types";

interface SubscriptionEntry {
  exchangeType: ExchangeType;
  token: string;
  mode: WsMode;
  refCount: number;
}

interface MarketDataStore {
  // ── State ──────────────────────────────────────────────────────────────────
  connectionStatus: WsConnectionStatus;
  ticks: Record<string, Tick>;              // key: `${exchangeType}_${token}`
  watchlist: WatchlistItem[];
  subscriptions: Record<string, SubscriptionEntry>; // same key

  // ── Connection ─────────────────────────────────────────────────────────────
  connect: (config: SmartWsConfig) => void;
  disconnect: () => void;

  // ── Subscriptions ──────────────────────────────────────────────────────────
  subscribe: (token: string, exchangeType: ExchangeType, mode?: WsMode) => void;
  unsubscribe: (token: string, exchangeType: ExchangeType) => void;

  // ── Watchlist ──────────────────────────────────────────────────────────────
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (token: string) => void;

  // ── Internal (called by WS event handlers) ─────────────────────────────────
  _setStatus: (status: WsConnectionStatus) => void;
  _upsertTick: (tick: Tick) => void;
}

function tickKey(exchangeType: number, token: string): string {
  return `${exchangeType}_${token}`;
}

// WS event cleanup functions
let unsubscribeTick: (() => void) | null = null;
let unsubscribeStatus: (() => void) | null = null;

export const useMarketDataStore = create<MarketDataStore>((set, get) => ({
  connectionStatus: "idle",
  ticks: {},
  watchlist: DEFAULT_WATCHLIST,
  subscriptions: {},

  // ── Connection ─────────────────────────────────────────────────────────────

  connect(config) {
    // Avoid re-registering handlers on hot-reload
    unsubscribeTick?.();
    unsubscribeStatus?.();

    unsubscribeStatus = smartWs.onStatusChange((status) => get()._setStatus(status));
    unsubscribeTick   = smartWs.onTick((tick) => get()._upsertTick(tick));

    smartWs.connect(config);
  },

  disconnect() {
    unsubscribeTick?.();
    unsubscribeStatus?.();
    unsubscribeTick = null;
    unsubscribeStatus = null;
    smartWs.disconnect();
    set({ connectionStatus: "disconnected", ticks: {}, subscriptions: {} });
  },

  // ── Subscriptions ──────────────────────────────────────────────────────────

  subscribe(token, exchangeType, mode = WS_MODE.QUOTE) {
    const key = tickKey(exchangeType, token);
    const existing = get().subscriptions[key];

    if (existing) {
      set((s) => ({
        subscriptions: {
          ...s.subscriptions,
          [key]: { ...existing, refCount: existing.refCount + 1 },
        },
      }));
      return;
    }

    // First subscriber — send to WS
    set((s) => ({
      subscriptions: {
        ...s.subscriptions,
        [key]: { exchangeType, token, mode, refCount: 1 },
      },
    }));
    smartWs.subscribe([{ exchangeType, tokens: [token] }], mode);
  },

  unsubscribe(token, exchangeType) {
    const key = tickKey(exchangeType, token);
    const entry = get().subscriptions[key];
    if (!entry) return;

    if (entry.refCount > 1) {
      set((s) => ({
        subscriptions: {
          ...s.subscriptions,
          [key]: { ...entry, refCount: entry.refCount - 1 },
        },
      }));
      return;
    }

    // Last subscriber — send unsubscribe and remove tick
    const { [key]: _removed, ...rest } = get().subscriptions;
    const { [key]: _tick, ...ticksRest } = get().ticks;
    set({ subscriptions: rest, ticks: ticksRest });
    smartWs.unsubscribe([{ exchangeType, tokens: [token] }], entry.mode);
  },

  // ── Watchlist ──────────────────────────────────────────────────────────────

  addToWatchlist(item) {
    set((s) => {
      if (s.watchlist.some((w) => w.token === item.token)) return s;
      return { watchlist: [...s.watchlist, item] };
    });
  },

  removeFromWatchlist(token) {
    set((s) => ({ watchlist: s.watchlist.filter((w) => w.token !== token) }));
  },

  // ── Internal ───────────────────────────────────────────────────────────────

  _setStatus(status) {
    set({ connectionStatus: status });
  },

  _upsertTick(tick) {
    const key = tickKey(tick.exchangeType, tick.token);
    set((s) => ({ ticks: { ...s.ticks, [key]: tick } }));
  },
}));

// ── Selectors ─────────────────────────────────────────────────────────────────

export function selectTick(
  state: MarketDataStore,
  token: string,
  exchangeType: ExchangeType,
): Tick | undefined {
  return state.ticks[tickKey(exchangeType, token)];
}
