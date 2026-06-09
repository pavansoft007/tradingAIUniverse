/**
 * Client-side order validation.
 *
 * Runs synchronously before sending to Angel One so the user gets
 * instant, field-level feedback without a round-trip.
 */

import {
  ANGEL_ORDER_TYPE,
  type AngelOrderType,
  type OrderFormValues,
  type OrderValidationResult,
} from "@/types/angel-order.types";

// ── Limits ────────────────────────────────────────────────────────────────────

const LIMITS = {
  maxQuantity:   10_000,
  minPrice:      0.01,
  maxPrice:      1_000_000,
  maxTriggerPct: 5,   // trigger must be within 5% of price for SL-LIMIT
} as const;

const SL_ORDER_TYPES: AngelOrderType[] = [
  ANGEL_ORDER_TYPE.STOPLOSS_LIMIT,
  ANGEL_ORDER_TYPE.STOPLOSS_MARKET,
];

const PRICE_NEEDED: AngelOrderType[] = [
  ANGEL_ORDER_TYPE.LIMIT,
  ANGEL_ORDER_TYPE.STOPLOSS_LIMIT,
];

// ── Main validator ────────────────────────────────────────────────────────────

export function validateOrder(values: OrderFormValues): OrderValidationResult {
  const errors: Record<string, string> = {};

  // Symbol
  if (!values.tradingsymbol?.trim()) {
    errors.tradingsymbol = "Symbol is required";
  }

  // Token
  if (!values.symboltoken?.trim()) {
    errors.symboltoken = "Symbol token is required";
  }

  // Quantity
  if (!values.quantity || values.quantity <= 0) {
    errors.quantity = "Quantity must be greater than 0";
  } else if (!Number.isInteger(values.quantity)) {
    errors.quantity = "Quantity must be a whole number";
  } else if (values.quantity > LIMITS.maxQuantity) {
    errors.quantity = `Maximum quantity is ${LIMITS.maxQuantity.toLocaleString()}`;
  }

  // Price (required for LIMIT and STOPLOSS_LIMIT)
  if (PRICE_NEEDED.includes(values.ordertype)) {
    if (!values.price || values.price <= 0) {
      errors.price = "Price is required for limit orders";
    } else if (values.price < LIMITS.minPrice) {
      errors.price = `Minimum price is ₹${LIMITS.minPrice}`;
    } else if (values.price > LIMITS.maxPrice) {
      errors.price = `Maximum price is ₹${LIMITS.maxPrice.toLocaleString()}`;
    }
  }

  // Trigger price (required for stoploss orders)
  if (SL_ORDER_TYPES.includes(values.ordertype)) {
    if (!values.triggerprice || values.triggerprice <= 0) {
      errors.triggerprice = "Trigger price is required for stop-loss orders";
    } else if (values.ordertype === ANGEL_ORDER_TYPE.STOPLOSS_LIMIT && values.price > 0) {
      const diff = Math.abs(values.triggerprice - values.price) / values.price * 100;
      if (diff > LIMITS.maxTriggerPct) {
        errors.triggerprice = `Trigger price should be within ${LIMITS.maxTriggerPct}% of limit price`;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Error classifier for retry decisions ──────────────────────────────────────

/**
 * Returns true if the error from Angel One is transient and worth retrying.
 *
 * Never retry on:
 *  - Validation failures (bad request from our side)
 *  - Insufficient funds / margin (exchange-level rejection)
 *  - Auth errors (handled by the token-refresh interceptor)
 */
export function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  const e = err as Error & { errorcode?: string; status?: number; angelError?: boolean };

  // Angel One application-level rejection — do not retry
  if (e.angelError) {
    const nonRetryable = [
      "AG8001",  // insufficient funds
      "AB2000",  // order rejected
      "AB2001",  // invalid order
      "AB2002",  // symbol not found
      "AB1004",  // session expired (auth interceptor handles this)
      "AB8001",  // margin shortage
    ];
    if (e.errorcode && nonRetryable.includes(e.errorcode)) return false;
  }

  // HTTP status codes
  const status = e.status;
  if (status !== undefined) {
    if (status === 429) return true;                      // rate limit
    if (status >= 500 && status <= 504) return true;      // server-side error
    if (status === 400 || status === 403 || status === 404) return false;
  }

  // Network / timeout (no status)
  if (!status && (e.message.includes("timeout") || e.message.includes("Network"))) {
    return true;
  }

  return false;
}

// ── Order summary for confirmation dialog ─────────────────────────────────────

export function buildOrderSummary(values: OrderFormValues, ltp?: number): {
  estimatedValue: number;
  marginRequired: number;
  slippageNote: string | null;
} {
  const refPrice =
    values.ordertype === ANGEL_ORDER_TYPE.MARKET
      ? (ltp ?? 0)
      : values.price;

  const estimatedValue = refPrice * values.quantity;

  // Simplified margin: 50% for INTRADAY, 100% for DELIVERY
  const marginPct = values.producttype === "INTRADAY" ? 0.5 : 1.0;
  const marginRequired = estimatedValue * marginPct;

  const slippageNote =
    values.ordertype === ANGEL_ORDER_TYPE.MARKET && ltp
      ? "Market order — execution price may differ slightly from LTP"
      : null;

  return { estimatedValue, marginRequired, slippageNote };
}
