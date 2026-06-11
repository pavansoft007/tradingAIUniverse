/**
 * Paper trading hooks — all data fetching and mutations for the paper trading simulator.
 *
 * All hooks read clientCode + jwtToken from useAngelOneStore and pass them
 * as custom headers. No component ever touches the API URL directly.
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAngelOneStore } from "@/store/useAngelOneStore";
import { sessionUtil } from "@/lib/utils/session";
import type {
  WalletData,
  PaperOrderData,
  PositionData,
  TradeData,
  TradingStats,
  PlaceOrderRequest,
} from "@/types/paper-trading.types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const PAPER_KEYS = {
  wallet:      ()              => ["paper", "wallet"]          as const,
  orders:      (status?: string) => ["paper", "orders", status] as const,
  positions:   ()              => ["paper", "positions"]       as const,
  trades:      (page: number)  => ["paper", "trades", page]   as const,
  stats:       ()              => ["paper", "stats"]           as const,
} as const;

// ── Internal fetch helper ─────────────────────────────────────────────────────

interface ApiResult<T> {
  success: boolean;
  data:    T;
  error?:  string;
}

async function paperFetch<T>(
  url:     string,
  opts:    RequestInit,
  cc:      string | null,
  jwt?:    string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Always send JWT so the server can extract clientCode from it as fallback
    ...(jwt ? { "x-jwt-token": jwt } : {}),
    ...(cc  ? { "x-client-code": cc } : {}),
  };
  const res  = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers ?? {}) } });
  const json: ApiResult<T> & { total?: number; trades?: unknown } = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

// ── useSessionHeaders — extract cc / jwt from store ───────────────────────────

function useSession() {
  const storeCC       = useAngelOneStore((s) => s.clientCode);
  const jwtToken      = useAngelOneStore((s) => s.session?.jwtToken ?? null);
  const isHydrated    = useAngelOneStore((s) => s.isHydrated);
  const isAuthenticated = useAngelOneStore((s) => s.isAuthenticated);

  // clientCode from store (preferred) or localStorage fallback
  const clientCode =
    storeCC ??
    (typeof window !== "undefined" ? sessionUtil.loadRememberedClientCode() || null : null);

  // Enable queries once the store has hydrated and the user is authenticated.
  // Even if clientCode is null, the server can extract it from the JWT token.
  const ready = isHydrated && isAuthenticated && !!jwtToken;

  return { clientCode, jwtToken, ready };
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export function usePaperWallet() {
  const { clientCode, jwtToken, ready } = useSession();
  const qc = useQueryClient();

  const query = useQuery<WalletData>({
    queryKey: PAPER_KEYS.wallet(),
    queryFn:  () => paperFetch<WalletData>("/api/paper/wallet", { method: "GET" }, clientCode!, jwtToken),
    enabled:  ready,
    staleTime:5_000,
  });

  const deposit = useMutation({
    mutationFn: (amount: number) =>
      paperFetch<WalletData>("/api/paper/wallet", {
        method: "POST",
        body:   JSON.stringify({ action: "deposit", amount }),
      }, clientCode!, jwtToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAPER_KEYS.wallet() }),
  });

  const withdraw = useMutation({
    mutationFn: (amount: number) =>
      paperFetch<WalletData>("/api/paper/wallet", {
        method: "POST",
        body:   JSON.stringify({ action: "withdraw", amount }),
      }, clientCode!, jwtToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAPER_KEYS.wallet() }),
  });

  const reset = useMutation({
    mutationFn: () =>
      paperFetch<WalletData>("/api/paper/wallet/reset", { method: "POST" }, clientCode!, jwtToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paper"] });
    },
  });

  return { ...query, deposit, withdraw, reset };
}

// ── Orders ────────────────────────────────────────────────────────────────────

export function usePaperOrders(status?: string) {
  const { clientCode, jwtToken, ready } = useSession();
  const qc = useQueryClient();
  const url = status ? `/api/paper/orders?status=${status}` : "/api/paper/orders";

  const query = useQuery<PaperOrderData[]>({
    queryKey: PAPER_KEYS.orders(status),
    queryFn:  () => paperFetch<PaperOrderData[]>(url, { method: "GET" }, clientCode!, jwtToken),
    enabled:  ready,
    staleTime:3_000,
    refetchInterval: 5_000,
  });

  const placeOrder = useMutation({
    mutationFn: (req: PlaceOrderRequest) =>
      paperFetch<PaperOrderData>("/api/paper/orders", {
        method: "POST",
        body:   JSON.stringify(req),
      }, clientCode!, jwtToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paper"] });
    },
  });

  const cancelOrder = useMutation({
    mutationFn: (orderId: string) =>
      paperFetch<PaperOrderData>(`/api/paper/orders/${orderId}`, { method: "DELETE" }, clientCode!, jwtToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAPER_KEYS.orders(status) });
    },
  });

  return { ...query, placeOrder, cancelOrder };
}

// ── Positions ─────────────────────────────────────────────────────────────────

export function usePaperPositions() {
  const { clientCode, jwtToken, ready } = useSession();

  return useQuery<PositionData[]>({
    queryKey: PAPER_KEYS.positions(),
    queryFn:  () => paperFetch<PositionData[]>("/api/paper/positions", { method: "GET" }, clientCode, jwtToken),
    enabled:  ready,
    staleTime:2_000,
    refetchInterval: 5_000,
  });
}

export function useSquareOffMis() {
  const { clientCode, jwtToken } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetch("/api/paper/positions/square-off", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken    ? { "x-jwt-token":   jwtToken }   : {}),
          ...(clientCode  ? { "x-client-code": clientCode }  : {}),
        },
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paper"] }),
  });
}

// ── Pending order matcher ─────────────────────────────────────────────────────

export function usePendingOrderMatcher(quotes: Map<string, number>) {
  const { clientCode, jwtToken, ready } = useSession();
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["paper", "check-pending", [...quotes.keys()].sort().join(",")],
    queryFn:  async () => {
      const quotesObj = Object.fromEntries(quotes);
      const res = await fetch("/api/paper/orders/check-pending", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken   ? { "x-jwt-token":   jwtToken }  : {}),
          ...(clientCode ? { "x-client-code": clientCode } : {}),
        },
        body: JSON.stringify({ quotes: quotesObj }),
      });
      const json = await res.json();
      if (json.success) {
        qc.invalidateQueries({ queryKey: ["paper", "orders"] });
        qc.invalidateQueries({ queryKey: ["paper", "positions"] });
      }
      return json;
    },
    enabled: ready && quotes.size > 0,
    refetchInterval: 5_000,
    staleTime: 4_000,
  });
}

// ── Trade journal ─────────────────────────────────────────────────────────────

export function useTradeJournal(page = 1, limit = 50) {
  const { clientCode, jwtToken, ready } = useSession();

  return useQuery<{ trades: TradeData[]; total: number }>({
    queryKey: PAPER_KEYS.trades(page),
    queryFn:  async () => {
      const res  = await fetch(`/api/paper/trades?page=${page}&limit=${limit}`, {
        headers: {
          ...(jwtToken   ? { "x-jwt-token":   jwtToken }  : {}),
          ...(clientCode ? { "x-client-code": clientCode } : {}),
        },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return { trades: json.trades as TradeData[], total: json.total as number };
    },
    enabled:  ready,
    staleTime:5_000,
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function usePaperStats() {
  const { clientCode, jwtToken, ready } = useSession();

  return useQuery<TradingStats>({
    queryKey: PAPER_KEYS.stats(),
    queryFn:  () => paperFetch<TradingStats>("/api/paper/stats", { method: "GET" }, clientCode, jwtToken),
    enabled:  ready,
    staleTime:5_000,
    refetchInterval: 10_000,
  });
}
