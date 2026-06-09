/**
 * Order executor with exponential-backoff retry.
 *
 * Wraps orderApi.placeOrder with:
 *  - Max 3 attempts
 *  - Delays: 500 ms → 1 000 ms → 2 000 ms
 *  - Retryable vs non-retryable classification via isRetryableError
 *  - Returns ExecutionResult including attempt count and wall-clock duration
 */

import { orderApi } from "@/lib/api/angelone/order.api";
import { isRetryableError } from "@/lib/orders/validator";
import {
  ANGEL_DURATION,
  ANGEL_ORDER_TYPE,
  ANGEL_PRODUCT_TYPE,
  ANGEL_VARIETY,
  type AngelPlaceOrderRequest,
  type ExecutionResult,
  type OrderFormValues,
} from "@/types/angel-order.types";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [500, 1_000, 2_000] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Map OrderFormValues (UI numbers) → AngelPlaceOrderRequest (API strings).
 * Variety is inferred: STOPLOSS for SL orders, NORMAL for everything else.
 */
function toApiPayload(values: OrderFormValues): AngelPlaceOrderRequest {
  const isStopLoss =
    values.ordertype === ANGEL_ORDER_TYPE.STOPLOSS_LIMIT ||
    values.ordertype === ANGEL_ORDER_TYPE.STOPLOSS_MARKET;

  return {
    variety:         isStopLoss ? ANGEL_VARIETY.STOPLOSS : ANGEL_VARIETY.NORMAL,
    tradingsymbol:   values.tradingsymbol,
    symboltoken:     values.symboltoken,
    transactiontype: values.transactiontype,
    exchange:        values.exchange,
    ordertype:       values.ordertype,
    producttype:     values.producttype,
    duration:        values.duration ?? ANGEL_DURATION.DAY,
    price:           values.price.toFixed(2),
    squareoff:       "0",
    stoploss:        "0",
    triggerprice:    values.triggerprice.toFixed(2),
    quantity:        String(values.quantity),
  };
}

// ── Executor ──────────────────────────────────────────────────────────────────

export async function executeOrder(values: OrderFormValues): Promise<ExecutionResult> {
  const payload = toApiPayload(values);
  const startMs = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await orderApi.placeOrder(payload);
      return {
        orderid:       result.orderid,
        uniqueorderid: result.uniqueorderid,
        script:        result.script,
        attempts:      attempt,
        durationMs:    Date.now() - startMs,
      };
    } catch (err) {
      lastError = err;

      const retryable = isRetryableError(err);
      const hasMoreAttempts = attempt < MAX_ATTEMPTS;

      if (!retryable || !hasMoreAttempts) break;

      await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }
  }

  throw lastError;
}

// ── Default form values ────────────────────────────────────────────────────────

export function defaultOrderFormValues(
  overrides: Partial<OrderFormValues> = {},
): OrderFormValues {
  return {
    tradingsymbol:   "",
    symboltoken:     "",
    exchange:        "NSE",
    transactiontype: "BUY",
    ordertype:       ANGEL_ORDER_TYPE.MARKET,
    producttype:     ANGEL_PRODUCT_TYPE.INTRADAY,
    duration:        ANGEL_DURATION.DAY,
    quantity:        1,
    price:           0,
    triggerprice:    0,
    ...overrides,
  };
}
