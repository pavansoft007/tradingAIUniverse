/**
 * Scrip search — calls the local /api/scrip-search route which downloads
 * and caches the Angel One OpenAPI scrip master file server-side.
 *
 * The old /rest/secure/angelbroking/order/v1/searchscrip endpoint was
 * removed from Angel One's backend; this replaces it.
 */

import type { AngelExchange } from "@/types/angel-order.types";

// ── Result type (re-exported for components) ──────────────────────────────────

export interface ScripSearchResult {
  tradingsymbol: string;
  symboltoken:   string;
  exchange:      AngelExchange;
  name:          string;
  instrumenttype:string;
  lotsize:       number;
  tickSize:      number;
  expiry:        string;
}

// ── Search function ───────────────────────────────────────────────────────────

export async function searchScrip(params: {
  exchange:    AngelExchange;
  searchscrip: string;
}): Promise<ScripSearchResult[]> {
  const qs  = new URLSearchParams({
    q:        params.searchscrip,
    exchange: params.exchange,
  });

  const res = await fetch(`/api/scrip-search?${qs.toString()}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Scrip search failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<ScripSearchResult[]>;
}
