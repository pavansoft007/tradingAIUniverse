import orderProxyClient from "@/lib/api/orderProxyClient";
import type { AngelApiResponse } from "@/types/angel-order.types";

// ── Candle / historical data ───────────────────────────────────────────────────

export type CandleInterval =
  | "ONE_MINUTE" | "THREE_MINUTE" | "FIVE_MINUTE" | "TEN_MINUTE"
  | "FIFTEEN_MINUTE" | "THIRTY_MINUTE" | "ONE_HOUR" | "ONE_DAY";

export interface CandleRequest {
  exchange:    string;          // "NSE" | "BSE"
  symboltoken: string;
  interval:    CandleInterval;
  fromdate:    string;          // "YYYY-MM-DD HH:mm"
  todate:      string;          // "YYYY-MM-DD HH:mm"
}

export interface CandleBar {
  timestamp: number;   // Unix ms
  open:      number;
  high:      number;
  low:       number;
  close:     number;
  volume:    number;
}

export async function getCandleData(req: CandleRequest): Promise<CandleBar[]> {
  const { data } = await orderProxyClient.post<AngelApiResponse<string[][] | null>>(
    "/rest/secure/angelbroking/historical/v1/getCandleData",
    req,
  );
  if (!data.status && data.errorcode !== "AB1006") return [];
  const raw = data.data ?? [];
  return raw
    .filter((row) => row.length >= 5)
    .map(([ts, o, h, l, c, v]) => ({
      timestamp: new Date(ts).getTime(),
      open:   Number(o),
      high:   Number(h),
      low:    Number(l),
      close:  Number(c),
      volume: Number(v ?? 0),
    }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns fromdate/todate strings for the Angel One candle API. */
export function candleDateRange(daysBack: number): { fromdate: string; todate: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt  = (d: Date) => {
    const y  = d.getFullYear();
    const mo = pad(d.getMonth() + 1);
    const da = pad(d.getDate());
    const h  = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${y}-${mo}-${da} ${h}:${mi}`;
  };
  const to   = new Date();
  const from = new Date(Date.now() - daysBack * 86_400_000);
  return { fromdate: fmt(from), todate: fmt(to) };
}
