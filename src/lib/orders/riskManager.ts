/**
 * Synchronous pre-execution risk checks.
 * Called by useOrderEngine before every order attempt.
 * All blocking conditions halt execution; warnings are advisory.
 */

import { ANGEL_ORDER_TYPE } from "@/types/angel-order.types";
import type { OrderFormValues } from "@/types/angel-order.types";

// ── Config shape (owned by useRiskStore) ──────────────────────────────────────

export interface RiskConfig {
  enabled:          boolean;   // master kill-switch
  maxOrderValue:    number;    // max single order value in INR (0 = unlimited)
  maxDailyLoss:     number;    // halt if realised+unrealised P&L < this (negative INR)
  maxOrdersPerMin:  number;    // rate limit for automated strategies (0 = unlimited)
  maxPositionPct:   number;    // max % of portfolio in one symbol (0 = unlimited)
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  enabled:          true,
  maxOrderValue:    500_000,   // ₹5 lakh per order
  maxDailyLoss:    -10_000,   // halt at -₹10k daily loss
  maxOrdersPerMin:  10,        // max 10 orders/min (AI safety)
  maxPositionPct:   0,         // disabled by default
};

// ── Input / Output ────────────────────────────────────────────────────────────

export interface RiskCheckInput {
  values:          OrderFormValues;
  config:          RiskConfig;
  availableCash:   number;     // from Angel One funds API
  dailyPnL:        number;     // sum of unrealised + realised from positions
  portfolioValue:  number;     // total portfolio value (0 if unknown)
  ordersThisMinute:number;
}

export interface RiskCheckResult {
  blocked:    boolean;
  reason:     string | null;     // first blocking reason
  warnings:   string[];          // non-blocking advisories
  estimatedValue:  number;
  marginRequired:  number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function refPrice(values: OrderFormValues, fallback = 0): number {
  return values.ordertype === ANGEL_ORDER_TYPE.MARKET ? fallback : (values.price || fallback);
}

function estimatedValue(values: OrderFormValues, ltpFallback = 0): number {
  return refPrice(values, ltpFallback) * values.quantity;
}

function marginRequired(values: OrderFormValues, ltpFallback = 0): number {
  const v = estimatedValue(values, ltpFallback);
  return values.producttype === "INTRADAY" ? v * 0.5 : v;
}

// ── Main check ────────────────────────────────────────────────────────────────

export function checkRisk(input: RiskCheckInput): RiskCheckResult {
  const { values, config, availableCash, dailyPnL, portfolioValue, ordersThisMinute } = input;
  const warnings: string[] = [];
  const est = estimatedValue(values);
  const margin = marginRequired(values);

  // Risk disabled — pass everything through
  if (!config.enabled) {
    return { blocked: false, reason: null, warnings, estimatedValue: est, marginRequired: margin };
  }

  // ── Blocking checks ───────────────────────────────────────────────────────

  // Rate limit
  if (config.maxOrdersPerMin > 0 && ordersThisMinute >= config.maxOrdersPerMin) {
    return {
      blocked: true,
      reason: `Rate limit: ${ordersThisMinute}/${config.maxOrdersPerMin} orders this minute`,
      warnings,
      estimatedValue: est,
      marginRequired: margin,
    };
  }

  // Daily loss limit
  if (config.maxDailyLoss < 0 && dailyPnL <= config.maxDailyLoss) {
    return {
      blocked: true,
      reason: `Daily loss limit reached: ₹${dailyPnL.toFixed(0)} ≤ ₹${config.maxDailyLoss}`,
      warnings,
      estimatedValue: est,
      marginRequired: margin,
    };
  }

  // Order value cap
  if (config.maxOrderValue > 0 && est > config.maxOrderValue) {
    return {
      blocked: true,
      reason: `Order value ₹${est.toLocaleString("en-IN")} exceeds limit ₹${config.maxOrderValue.toLocaleString("en-IN")}`,
      warnings,
      estimatedValue: est,
      marginRequired: margin,
    };
  }

  // ── Soft warnings ─────────────────────────────────────────────────────────

  // Margin check (warn if insufficient, don't block — exchange will reject)
  if (availableCash > 0 && margin > availableCash) {
    warnings.push(
      `Margin required ₹${margin.toLocaleString("en-IN")} may exceed available cash ₹${availableCash.toLocaleString("en-IN")}`,
    );
  }

  // Position concentration
  if (config.maxPositionPct > 0 && portfolioValue > 0 && est / portfolioValue > config.maxPositionPct) {
    warnings.push(
      `Position size ${((est / portfolioValue) * 100).toFixed(1)}% exceeds recommended ${(config.maxPositionPct * 100).toFixed(0)}% max`,
    );
  }

  // Large order warning (> 50% of available cash)
  if (availableCash > 0 && margin > availableCash * 0.5) {
    warnings.push("This order uses more than 50% of available margin");
  }

  return { blocked: false, reason: null, warnings, estimatedValue: est, marginRequired: margin };
}

// ── Market-hours helper ───────────────────────────────────────────────────────

/**
 * Returns true if NSE/BSE regular market session is open (IST 09:15 – 15:30).
 * Also returns true during pre-open (09:00 – 09:15).
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istMs = now.getTime() + (5 * 60 + 30) * 60_000 + now.getTimezoneOffset() * 60_000;
  const ist   = new Date(istMs);
  const day   = ist.getDay();                       // 0 = Sun, 6 = Sat
  if (day === 0 || day === 6) return false;         // weekend

  const hour = ist.getHours();
  const min  = ist.getMinutes();
  const t    = hour * 60 + min;

  return t >= 9 * 60 && t < 15 * 60 + 30;          // 09:00 – 15:30
}
