/**
 * GET /api/scrip-search?q=RELIA&exchange=NSE
 *
 * Searches the Angel One OpenAPI scrip master file.
 * The master JSON (~25 MB) is fetched once per server process and kept in
 * memory; a stale-while-revalidate pattern refreshes it every hour.
 *
 * Results are scored so:
 *   1. Exact symbol match (e.g. "RELIANCE-EQ")
 *   2. Symbol starts with query
 *   3. Name contains query
 */

import { type NextRequest, NextResponse } from "next/server";

// ── Exchange segment mapping ───────────────────────────────────────────────────
// The scrip master file uses lowercase segment names (e.g. "nse_cm") while the
// Angel One order API uses uppercase names (e.g. "NSE").  We map both ways.

const EXCH_SEG_MAP: Record<string, string> = {
  NSE: "nse_cm",
  BSE: "bse_cm",
  NFO: "nse_fo",
  MCX: "mcx_fo",
  BFO: "bse_fo",
  CDS: "cde_fo",
};

const EXCH_SEG_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(EXCH_SEG_MAP).map(([k, v]) => [v, k]),
);

// ── Scrip master types ────────────────────────────────────────────────────────

interface RawScrip {
  token:          string;
  symbol:         string;
  name:           string;
  expiry:         string;
  strike:         string;
  lotsize:        string;
  instrumenttype: string;  // "" = equity, "FUTSTK" = futures, "OPTSTK" = options …
  exch_seg:       string;  // "nse_cm", "bse_cm", "nse_fo", "mcx_fo" …
  tick_size:      string;  // paise (e.g. "5.000000" = ₹0.05)
}

export interface ScripResult {
  tradingsymbol: string;
  symboltoken:   string;
  exchange:      string;
  name:          string;
  instrumenttype:string;
  lotsize:       number;
  tickSize:      number;
  expiry:        string;
}

// ── In-process cache ──────────────────────────────────────────────────────────

const MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";
const TTL_MS     = 60 * 60 * 1_000;   // 1 h

let cache: RawScrip[] | null  = null;
let cacheAt                   = 0;

async function getMaster(): Promise<RawScrip[]> {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;

  const res = await fetch(MASTER_URL, {
    headers: { "Accept-Encoding": "gzip, deflate" },
  });
  if (!res.ok) throw new Error(`Scrip master fetch failed: ${res.status}`);

  cache   = (await res.json()) as RawScrip[];
  cacheAt = Date.now();
  return cache;
}

// ── Normalise one scrip entry ─────────────────────────────────────────────────

function normalise(s: RawScrip): ScripResult {
  return {
    tradingsymbol: s.symbol,
    symboltoken:   s.token,
    // Convert "nse_cm" → "NSE" so the result can be passed directly to order API
    exchange:      EXCH_SEG_REVERSE[s.exch_seg] ?? s.exch_seg.toUpperCase(),
    name:          s.name,
    instrumenttype:s.instrumenttype,
    lotsize:       parseInt(s.lotsize, 10) || 1,
    // tick_size is in paise in the master file (e.g. "5.000000" → ₹0.05)
    tickSize:      parseFloat(s.tick_size) / 100 || 0.05,
    expiry:        s.expiry || "",
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const q        = (searchParams.get("q") ?? "").trim().toUpperCase();
  const exchange = (searchParams.get("exchange") ?? "NSE").toUpperCase();

  if (q.length < 2) return NextResponse.json([]);

  try {
    const all = await getMaster();

    const EQUITY_TYPES = new Set(["", "EQ"]);    // blank = equity on NSE/BSE
    const exchSeg = EXCH_SEG_MAP[exchange] ?? exchange.toLowerCase();

    const scored: Array<[number, RawScrip]> = [];

    for (const s of all) {
      if (s.exch_seg !== exchSeg) continue;
      if (!EQUITY_TYPES.has(s.instrumenttype)) continue;

      const sym  = s.symbol.toUpperCase();
      const name = s.name.toUpperCase();

      if (sym === q || sym === `${q}-EQ` || sym === `${q}-BE`) {
        scored.push([0, s]);
      } else if (sym.startsWith(q)) {
        scored.push([1, s]);
      } else if (name.startsWith(q)) {
        scored.push([2, s]);
      } else if (name.includes(q)) {
        scored.push([3, s]);
      }

      if (scored.length >= 200) break;  // early exit — score then slice
    }

    const results = scored
      .sort(([a], [b]) => a - b)
      .slice(0, 20)
      .map(([, s]) => normalise(s));

    return NextResponse.json(results);
  } catch (err) {
    console.error("[scrip-search]", err);
    return NextResponse.json(
      { error: "Scrip search temporarily unavailable" },
      { status: 503 },
    );
  }
}
