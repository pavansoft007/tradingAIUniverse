"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAngelOneStore } from "@/store/useAngelOneStore";
import { selectTick, useMarketDataStore } from "@/store/useMarketDataStore";
import type {
  ExchangeType,
  Tick,
  WatchlistItem,
  WsConnectionStatus,
  WsMode,
} from "@/types/smartws.types";
import { WS_MODE } from "@/types/smartws.types";

// ── Connection lifecycle ──────────────────────────────────────────────────────

/**
 * Initialises the SmartAPI WebSocket connection when a valid auth session exists.
 * Call once at the top of the dashboard layout.
 */
export function useSmartWsConnection() {
  const session    = useAngelOneStore((s) => s.session);
  const clientCode = useAngelOneStore((s) => s.clientCode);
  const { connect, disconnect } = useMarketDataStore(
    useShallow((s) => ({ connect: s.connect, disconnect: s.disconnect })),
  );

  useEffect(() => {
    if (!session?.jwtToken || !session.feedToken || !clientCode) return;

    connect({
      jwtToken:    session.jwtToken,
      feedToken:   session.feedToken,
      clientCode,
      apiKey:      process.env.NEXT_PUBLIC_ANGEL_ONE_API_KEY ?? "",
    });

    return () => disconnect();
  // Re-connect only when the tokens genuinely change, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.jwtToken, session?.feedToken, clientCode]);
}

// ── Status ────────────────────────────────────────────────────────────────────

export function useConnectionStatus(): WsConnectionStatus {
  return useMarketDataStore((s) => s.connectionStatus);
}

// ── Single token tick ─────────────────────────────────────────────────────────

/**
 * Subscribe to a single token and return its latest tick.
 * Automatically unsubscribes when the component unmounts.
 */
export function useTickData(
  token: string,
  exchangeType: ExchangeType,
  mode: WsMode = WS_MODE.QUOTE,
): Tick | undefined {
  const { subscribe, unsubscribe } = useMarketDataStore(
    useShallow((s) => ({ subscribe: s.subscribe, unsubscribe: s.unsubscribe })),
  );

  useEffect(() => {
    if (!token) return;
    subscribe(token, exchangeType, mode);
    return () => unsubscribe(token, exchangeType);
  }, [token, exchangeType, mode, subscribe, unsubscribe]);

  return useMarketDataStore((s) => selectTick(s, token, exchangeType));
}

// ── Watchlist ticks ───────────────────────────────────────────────────────────

/**
 * Subscribe to every item in the current watchlist and return live ticks.
 * Handles bulk subscribe/unsubscribe as the watchlist changes.
 */
export function useWatchlistTicks(mode: WsMode = WS_MODE.QUOTE): {
  watchlist: WatchlistItem[];
  ticks: Record<string, Tick>;
  connectionStatus: WsConnectionStatus;
} {
  const watchlist         = useMarketDataStore((s) => s.watchlist);
  const ticks             = useMarketDataStore((s) => s.ticks);
  const connectionStatus  = useMarketDataStore((s) => s.connectionStatus);
  const { subscribe, unsubscribe } = useMarketDataStore(
    useShallow((s) => ({ subscribe: s.subscribe, unsubscribe: s.unsubscribe })),
  );

  useEffect(() => {
    watchlist.forEach(({ token, exchangeType }) => subscribe(token, exchangeType, mode));
    return () => {
      watchlist.forEach(({ token, exchangeType }) => unsubscribe(token, exchangeType));
    };
  }, [watchlist, mode, subscribe, unsubscribe]);

  return { watchlist, ticks, connectionStatus };
}

// ── Watchlist management ──────────────────────────────────────────────────────

export function useWatchlistActions() {
  return useMarketDataStore(
    useShallow((s) => ({
      addToWatchlist:    s.addToWatchlist,
      removeFromWatchlist: s.removeFromWatchlist,
      watchlist:         s.watchlist,
    })),
  );
}
