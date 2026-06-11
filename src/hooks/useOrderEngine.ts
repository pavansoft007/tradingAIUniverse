"use client";

/**
 * useOrderEngine — AI-ready order execution engine.
 *
 * Provides a single `submitOrder(values, options)` surface that:
 *  1. Validates the order client-side
 *  2. Runs risk checks (margin, daily loss, rate limit, value cap)
 *  3. Checks session validity
 *  4. Executes via executeOrder() with automatic retry
 *  5. Pushes toast notification
 *  6. Records every attempt in the persisted audit log
 *
 * The `source` metadata makes this suitable for AI automation:
 * automated strategies pass source: "ai_signal" with optional signalId/confidence.
 * The dry-run mode lets AI strategies simulate without live execution.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { executeOrder } from "@/lib/orders/executor";
import { validateOrder, buildOrderSummary } from "@/lib/orders/validator";
import { checkRisk, isMarketOpen } from "@/lib/orders/riskManager";
import { ORDER_KEYS } from "@/hooks/useAngelOrders";
import { useOrderStore } from "@/store/useOrderStore";
import { useRiskStore } from "@/store/useRiskStore";
import { sessionUtil } from "@/lib/utils/session";
import { useFunds } from "@/hooks/usePortfolio";
import { usePositions } from "@/hooks/useAngelOrders";
import type { OrderFormValues } from "@/types/angel-order.types";
import type { AuditEntry, OrderSource } from "@/store/useRiskStore";

// ── Submit options ────────────────────────────────────────────────────────────

export interface SubmitOptions {
  source:      OrderSource;
  signalId?:   string;
  confidence?: number;
  notes?:      string;
  /** Simulate without placing a real order. Logged as "dry_run". */
  dryRun?:     boolean;
  /** Skip market-hours check (useful for AMO orders). */
  allowOffHours?: boolean;
}

export interface EngineResult {
  success:     boolean;
  blocked?:    boolean;
  blockReason?:string;
  dryRun?:     boolean;
  orderId?:    string;
  attempts?:   number;
  durationMs?: number;
  error?:      string;
  warnings?:   string[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOrderEngine() {
  const qc             = useQueryClient();
  const { setPlacing, setPlacingError, pushNotif } = useOrderStore();
  const { config: riskConfig, tickOrder, pushAudit } = useRiskStore();
  const ordersThisMinute = useRiskStore((s) => s.ordersThisMinute);
  const isPlacing        = useOrderStore((s) => s.isPlacing);

  const { data: fundsData }    = useFunds();
  const { data: positionsData } = usePositions();

  const availableCash = fundsData?.availablecash
    ? parseFloat(fundsData.availablecash)
    : 0;

  const dailyPnL = (positionsData ?? []).reduce((sum, p) => {
    return sum + parseFloat(p.unrealised || "0") + parseFloat(p.realised || "0");
  }, 0);

  // ── submitOrder ─────────────────────────────────────────────────────────────

  const submitOrder = useCallback(
    async (values: OrderFormValues, options: SubmitOptions): Promise<EngineResult> => {
      const {
        source, signalId, confidence, notes,
        dryRun = false, allowOffHours = false,
      } = options;

      const auditBase: Omit<AuditEntry, "result" | "orderId" | "attempts" | "durationMs" | "error"> = {
        id:              `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp:       Date.now(),
        symbol:          values.tradingsymbol,
        transactiontype: values.transactiontype,
        ordertype:       values.ordertype,
        quantity:        values.quantity,
        price:           values.price,
        source,
        signalId,
        confidence,
        notes,
      };

      // ── 1. Session check ──────────────────────────────────────────────────
      if (!sessionUtil.loadJWT()) {
        const error = "Not authenticated — please log in";
        pushAudit({ ...auditBase, result: "failed", error });
        return { success: false, error };
      }

      // ── 2. Market hours check ─────────────────────────────────────────────
      if (!allowOffHours && !isMarketOpen()) {
        // Don't block — Angel One accepts AMO orders; just warn
        pushNotif("warning", "Market Closed", "Order will be queued as AMO");
      }

      // ── 3. Client-side validation ─────────────────────────────────────────
      const validation = validateOrder(values);
      if (!validation.valid) {
        const error = Object.values(validation.errors).join("; ");
        pushAudit({ ...auditBase, result: "failed", error });
        return { success: false, error };
      }

      // ── 4. Risk check ─────────────────────────────────────────────────────
      const risk = checkRisk({
        values,
        config:          riskConfig,
        availableCash,
        dailyPnL,
        portfolioValue:  0,
        ordersThisMinute,
      });

      if (risk.blocked) {
        pushNotif("error", "Risk Check Failed", risk.reason ?? "Order blocked");
        pushAudit({ ...auditBase, result: "risk_blocked", error: risk.reason ?? undefined });
        return { success: false, blocked: true, blockReason: risk.reason ?? undefined, warnings: risk.warnings };
      }

      // ── 5. Dry run ────────────────────────────────────────────────────────
      if (dryRun) {
        const summary = buildOrderSummary(values);
        pushAudit({ ...auditBase, result: "dry_run" });
        pushNotif(
          "info",
          "Dry Run",
          `${values.transactiontype} ${values.quantity} × ${values.tradingsymbol} — est. ₹${summary.estimatedValue.toLocaleString("en-IN")}`,
        );
        return { success: true, dryRun: true, warnings: risk.warnings };
      }

      // ── 6. Execute ────────────────────────────────────────────────────────
      setPlacing(true);
      setPlacingError(null);
      tickOrder();

      try {
        const result = await executeOrder(values);

        setPlacing(false);
        pushNotif(
          "success",
          `Order ${source === "ai_signal" ? "🤖 " : ""}Placed`,
          `${result.script} · ID ${result.orderid}${source !== "manual" ? ` · via ${source}` : ""}`,
          result.orderid,
        );

        pushAudit({
          ...auditBase,
          result:    "success",
          orderId:   result.orderid,
          attempts:  result.attempts,
          durationMs:result.durationMs,
        });

        // Refresh order book
        void qc.invalidateQueries({ queryKey: ORDER_KEYS.book });

        return {
          success: true,
          orderId: result.orderid,
          attempts: result.attempts,
          durationMs: result.durationMs,
          warnings: risk.warnings,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : "Order failed";
        setPlacing(false);
        setPlacingError(error);
        pushNotif("error", "Order Failed", error);
        pushAudit({ ...auditBase, result: "failed", error });
        return { success: false, error, warnings: risk.warnings };
      }
    },
    [
      riskConfig, availableCash, dailyPnL, ordersThisMinute,
      setPlacing, setPlacingError, pushNotif, tickOrder, pushAudit, qc,
    ],
  );

  // ── riskPreview ─────────────────────────────────────────────────────────────

  const riskPreview = useCallback(
    (values: OrderFormValues) =>
      checkRisk({
        values,
        config:          riskConfig,
        availableCash,
        dailyPnL,
        portfolioValue:  0,
        ordersThisMinute,
      }),
    [riskConfig, availableCash, dailyPnL, ordersThisMinute],
  );

  return {
    submitOrder,
    riskPreview,
    isPlacing,
    isMarketOpen:    isMarketOpen(),
    availableCash,
    dailyPnL,
    riskConfig,
    ordersThisMinute,
  };
}
