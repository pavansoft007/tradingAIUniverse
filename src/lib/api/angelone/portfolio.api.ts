import orderProxyClient from "@/lib/api/orderProxyClient";
import type { AngelApiResponse } from "@/types/angel-order.types";
import type { AngelFunds, AngelHoldingsData, AngelProfile, AngelQuote } from "@/types/angel-portfolio.types";

function assertOk<T>(res: AngelApiResponse<T>, ctx: string): T {
  if (!res.status && res.errorcode !== "AB1006") {
    const err = Object.assign(new Error(`${ctx}: ${res.message || "Unknown error"}`), {
      errorcode:  res.errorcode,
      angelError: true,
    });
    throw err;
  }
  return res.data;
}

// ── Holdings ──────────────────────────────────────────────────────────────────

const EMPTY_HOLDINGS: AngelHoldingsData = {
  holdings: [],
  totalholding: { totalholdingvalue: 0, totalinvvalue: 0, totalprofitandloss: 0, totalpnlpercentage: 0 },
};

/**
 * GET /portfolio/v1/getHolding
 * Returns holdings for the current session (T-day settled holdings).
 */
export async function getHolding(): Promise<AngelHoldingsData> {
  const { data } = await orderProxyClient.get<AngelApiResponse<AngelHoldingsData | null>>(
    "/rest/secure/angelbroking/portfolio/v1/getHolding",
  );
  return assertOk(data, "getHolding") ?? EMPTY_HOLDINGS;
}

/**
 * GET /portfolio/v1/getAllHolding
 * Returns all holdings across all exchanges including T+1.
 */
export async function getHoldings(): Promise<AngelHoldingsData> {
  const { data } = await orderProxyClient.get<AngelApiResponse<AngelHoldingsData | null>>(
    "/rest/secure/angelbroking/portfolio/v1/getAllHolding",
  );
  return assertOk(data, "getAllHoldings") ?? EMPTY_HOLDINGS;
}

// ── Funds / RMS ───────────────────────────────────────────────────────────────

export async function getFunds(): Promise<AngelFunds> {
  const { data } = await orderProxyClient.get<AngelApiResponse<AngelFunds | null>>(
    "/rest/secure/angelbroking/user/v1/getRMS",
  );
  return assertOk(data, "getFunds") ?? {} as AngelFunds;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<AngelProfile> {
  const { data } = await orderProxyClient.get<AngelApiResponse<AngelProfile | null>>(
    "/rest/secure/angelbroking/user/v1/getProfile",
  );
  return assertOk(data, "getProfile") ?? {} as AngelProfile;
}

// ── Market quote (LTP / OHLC / FULL with depth) ───────────────────────────────

export type QuoteMode = "LTP" | "OHLC" | "FULL";

export interface QuoteRequest {
  mode:           QuoteMode;
  exchangeTokens: Record<string, string[]>;  // { "NSE": ["2885", "1333"] }
}

export async function getMarketQuote(req: QuoteRequest): Promise<AngelQuote[]> {
  const { data } = await orderProxyClient.post<
    AngelApiResponse<{ fetched: AngelQuote[]; unfetched: unknown[] } | null>
  >("/rest/secure/angelbroking/market/v1/quote/", req);

  if (!data.status && data.errorcode !== "AB1006") {
    assertOk(data, "getMarketQuote");
  }
  return data.data?.fetched ?? [];
}
