/**
 * Angel One SmartAPI binary packet parser.
 *
 * Byte layout (big-endian throughout):
 *   [0]      uint8   subscription_mode
 *   [1]      uint8   exchange_type
 *   [2..26]  bytes   token (null-padded to 25 chars)
 *   [27..34] int64   sequence_number
 *   [35..42] int64   exchange_timestamp (Unix ms)
 *   [43..50] int64   ltp (÷ 100 → ₹)
 *   --- Mode 2+ (Quote, 123 B total) ---
 *   [51..58] int64   last_traded_qty
 *   [59..66] int64   avg_traded_price (÷ 100)
 *   [67..74] int64   vol_traded_today
 *   [75..82] float64 total_buy_qty
 *   [83..90] float64 total_sell_qty
 *   [91..98] int64   open_price_day (÷ 100)
 *   [99..106] int64  high_price_day (÷ 100)
 *   [107..114] int64 low_price_day (÷ 100)
 *   [115..122] int64 close_price (÷ 100)
 *   --- Mode 3+ (SnapQuote, 339 B total) ---
 *   [123..130] int64 last_traded_ts (Unix ms)
 *   [131..138] int64 open_interest
 *   [139..146] int64 oi_change_pct (÷ 100)
 *   [147..154] int64 upper_circuit (÷ 100)
 *   [155..162] int64 lower_circuit (÷ 100)
 *   [163..170] int64 52_week_high (÷ 100)
 *   [171..178] int64 52_week_low (÷ 100)
 *   [179..258] 5 × (price int64 ÷100 + qty int64) best buy
 *   [259..338] 5 × (price int64 ÷100 + qty int64) best sell
 */

import type { DepthEntry, ExchangeType, Tick, WsMode } from "@/types/smartws.types";

function readPrice(view: DataView, offset: number): number {
  return Number(view.getBigInt64(offset, false)) / 100;
}

function readInt(view: DataView, offset: number): number {
  return Number(view.getBigInt64(offset, false));
}

function readToken(view: DataView, offset: number): string {
  const chars: number[] = [];
  for (let i = 0; i < 25; i++) {
    const byte = view.getUint8(offset + i);
    if (byte === 0) break;
    chars.push(byte);
  }
  return String.fromCharCode(...chars).trim();
}

function readDepth(view: DataView, offset: number): DepthEntry[] {
  const entries: DepthEntry[] = [];
  for (let i = 0; i < 5; i++) {
    entries.push({
      price: readPrice(view, offset + i * 16),
      quantity: readInt(view, offset + i * 16 + 8),
    });
  }
  return entries;
}

export function parseBinaryTick(buffer: ArrayBuffer): Tick | null {
  try {
    const view = new DataView(buffer);
    const mode = view.getUint8(0) as WsMode;
    const exchangeType = view.getUint8(1) as ExchangeType;
    const token = readToken(view, 2);
    const sequenceNumber = readInt(view, 27);
    const exchangeTimestamp = readInt(view, 35);
    const ltp = readPrice(view, 43);

    const tick: Tick = { mode, exchangeType, token, sequenceNumber, exchangeTimestamp, ltp };

    if (mode >= 2 && buffer.byteLength >= 123) {
      tick.lastTradedQty   = readInt(view, 51);
      tick.avgTradedPrice  = readPrice(view, 59);
      tick.volumeTradedToday = readInt(view, 67);
      tick.totalBuyQty     = view.getFloat64(75, false);
      tick.totalSellQty    = view.getFloat64(83, false);
      tick.open            = readPrice(view, 91);
      tick.high            = readPrice(view, 99);
      tick.low             = readPrice(view, 107);
      tick.close           = readPrice(view, 115);
    }

    if (mode >= 3 && buffer.byteLength >= 339) {
      tick.lastTradedTimestamp  = readInt(view, 123);
      tick.openInterest         = readInt(view, 131);
      tick.openInterestChangePct = readPrice(view, 139);
      tick.upperCircuit         = readPrice(view, 147);
      tick.lowerCircuit         = readPrice(view, 155);
      tick.week52High           = readPrice(view, 163);
      tick.week52Low            = readPrice(view, 171);
      tick.bestFiveBuy          = readDepth(view, 179);
      tick.bestFiveSell         = readDepth(view, 259);
    }

    return tick;
  } catch {
    return null;
  }
}
