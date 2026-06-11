"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { DEFAULT_RISK_CONFIG } from "@/lib/orders/riskManager";
import type { RiskConfig } from "@/lib/orders/riskManager";

// ── Audit log ─────────────────────────────────────────────────────────────────

export type OrderSource = "manual" | "ai_signal" | "alert" | "strategy";

export interface AuditEntry {
  id:          string;
  timestamp:   number;
  symbol:      string;
  transactiontype: "BUY" | "SELL";
  ordertype:   string;
  quantity:    number;
  price:       number;
  source:      OrderSource;
  signalId?:   string;
  confidence?: number;
  notes?:      string;
  result:      "success" | "failed" | "risk_blocked" | "dry_run";
  orderId?:    string;
  attempts?:   number;
  durationMs?: number;
  error?:      string;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface RiskStore {
  // Persisted: risk limits configuration
  config: RiskConfig;

  // Runtime: rate-limit window (not persisted)
  ordersThisMinute: number;
  minuteWindowStart: number;

  // Audit log (persisted, capped at 200 entries)
  auditLog: AuditEntry[];

  // ── Actions ───────────────────────────────────────────────────────────────
  setConfig:    (partial: Partial<RiskConfig>) => void;
  toggleRisk:   () => void;

  /** Increments rate-limit counter. Returns updated count (already-flushed). */
  tickOrder:    () => number;

  /** Append an audit entry (capped at 200). */
  pushAudit:    (entry: AuditEntry) => void;
  clearAudit:   () => void;
}

export const useRiskStore = create<RiskStore>()(
  devtools(
    persist(
      (set, get) => ({
        config:            DEFAULT_RISK_CONFIG,
        ordersThisMinute:  0,
        minuteWindowStart: Date.now(),
        auditLog:          [],

        setConfig: (partial) =>
          set((s) => ({ config: { ...s.config, ...partial } })),

        toggleRisk: () =>
          set((s) => ({ config: { ...s.config, enabled: !s.config.enabled } })),

        tickOrder: () => {
          const now = Date.now();
          const s   = get();
          const elapsed = now - s.minuteWindowStart;

          // Reset window every 60 s
          if (elapsed >= 60_000) {
            set({ ordersThisMinute: 1, minuteWindowStart: now });
            return 1;
          }
          const next = s.ordersThisMinute + 1;
          set({ ordersThisMinute: next });
          return next;
        },

        pushAudit: (entry) =>
          set((s) => ({
            auditLog: [entry, ...s.auditLog].slice(0, 200),
          })),

        clearAudit: () => set({ auditLog: [] }),
      }),
      {
        name:    "risk-store-v1",
        // Only persist config + auditLog; runtime counters start fresh
        partialize: (s) => ({ config: s.config, auditLog: s.auditLog }),
      },
    ),
    { name: "RiskStore" },
  ),
);
