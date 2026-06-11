/**
 * Slippage simulation model for paper trading.
 *
 * Market orders:      random 0.02–0.08 % slippage (higher for low-volume stocks)
 * SL-Market orders:   market slippage + 0.05% gap penalty (order book skip)
 * Limit/SL-Limit:     filled at exact stated price — zero slippage
 */

import type { PaperOrderSide, PaperOrderType } from "@/types/paper-trading.types";

export interface SlippageResult {
  fillPrice:   number;
  slippagePct: number;
  slippageAmt: number;
}

const SLIPPAGE_MIN = 0.02;   // 0.02 %
const SLIPPAGE_MAX = 0.08;   // 0.08 %
const SL_GAP_PENALTY = 0.05; // additional 0.05 % for stop-loss triggered market

function randomSlippage(volume: number): number {
  // Low-volume stocks (<50k) get worse execution
  const base = volume > 0 && volume < 50_000
    ? SLIPPAGE_MAX
    : SLIPPAGE_MIN + Math.random() * (SLIPPAGE_MAX - SLIPPAGE_MIN);
  return base;
}

export function computeSlippage(
  orderType:  PaperOrderType,
  side:       PaperOrderSide,
  ltp:        number,
  volume = 0,
): SlippageResult {
  if (orderType === "LIMIT" || orderType === "STOPLOSS_LIMIT") {
    return { fillPrice: ltp, slippagePct: 0, slippageAmt: 0 };
  }

  let pct = randomSlippage(volume);
  if (orderType === "STOPLOSS_MARKET") pct += SL_GAP_PENALTY;

  // Buys pay a higher price; sells receive a lower price
  const multiplier = side === "BUY" ? 1 + pct / 100 : 1 - pct / 100;
  const fillPrice  = Math.round(ltp * multiplier * 100) / 100;
  const slippageAmt = Math.abs(fillPrice - ltp) * 1; // per share

  return { fillPrice, slippagePct: pct, slippageAmt };
}

/** Check if a LIMIT order condition is met at the given LTP. */
export function limitHit(
  side: PaperOrderSide,
  limitPrice: number,
  ltp: number,
): boolean {
  return side === "BUY" ? ltp <= limitPrice : ltp >= limitPrice;
}

/** Check if a SL trigger condition is met at the given LTP. */
export function stopTriggered(
  side: PaperOrderSide,
  triggerPrice: number,
  ltp: number,
): boolean {
  // For a BUY stop: triggered when price RISES to trigger (e.g. breakout buy)
  // For a SELL stop: triggered when price FALLS to trigger (e.g. stop-loss)
  return side === "BUY" ? ltp >= triggerPrice : ltp <= triggerPrice;
}
