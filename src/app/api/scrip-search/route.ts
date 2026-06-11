/**
 * GET /api/scrip-search?q=RELIA&exchange=NSE
 *
 * Searches the Angel One OpenAPI scrip master file.
 * The master JSON (~35 MB) is fetched once per server process and cached for 1h.
 *
 * Results are scored so:
 *   1. Exact symbol match  (e.g. "TCS-EQ")
 *   2. Symbol starts with query
 *   3. Name starts with query
 *   4. Name contains query
 *
 * NOTE: The Angel One scrip master uses uppercase exchange names in the
 * `exch_seg` field (e.g. "NSE", "BSE", "NFO") — NOT the lowercase segment
 * names ("nse_cm") that were used in older API versions.
 */

import { type NextRequest, NextResponse } from "next/server";

// ── Instrument types to exclude (indices, not directly tradeable) ──────────────
const SKIP_TYPES = new Set(["AMXIDX", "UNDIND"]);

// ── Scrip master types ────────────────────────────────────────────────────────

interface RawScrip {
  token:          string;
  symbol:         string;
  name:           string;
  expiry:         string;
  strike:         string;
  lotsize:        string;
  instrumenttype: string;  // "" | "EQ" = equity; "AMXIDX" = index; "FUTSTK" = futures …
  exch_seg:       string;  // "NSE", "BSE", "NFO", "MCX" …
  tick_size:      string;
}

export interface ScripResult {
  tradingsymbol:  string;
  symboltoken:    string;
  exchange:       string;
  name:           string;
  instrumenttype: string;
  lotsize:        number;
  tickSize:       number;
  expiry:         string;
}

// ── In-process cache ──────────────────────────────────────────────────────────

const MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";
const TTL_MS     = 60 * 60 * 1_000;   // 1 h

let cache:   RawScrip[] | null = null;
let cacheAt                    = 0;

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
    tradingsymbol:  s.symbol,
    symboltoken:    s.token,
    exchange:       s.exch_seg,   // "NSE", "BSE", etc. — already uppercase
    name:           s.name,
    instrumenttype: s.instrumenttype,
    lotsize:        parseInt(s.lotsize, 10) || 1,
    tickSize:       parseFloat(s.tick_size) / 100 || 0.05,
    expiry:         s.expiry || "",
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

    const scored: Array<[number, RawScrip]> = [];

    for (const s of all) {
      // Filter by exchange segment (direct match — field is already uppercase)
      if (s.exch_seg !== exchange) continue;

      // Skip non-tradeable instrument types (indices, etc.)
      if (SKIP_TYPES.has(s.instrumenttype)) continue;

      const sym  = s.symbol.toUpperCase();
      const name = s.name.toUpperCase();

      if (sym === q || sym === `${q}-EQ` || sym === `${q}-BE` || sym === `${q}-N`) {
        scored.push([0, s]);
      } else if (sym.startsWith(q)) {
        scored.push([1, s]);
      } else if (name.startsWith(q)) {
        scored.push([2, s]);
      } else if (name.includes(q)) {
        scored.push([3, s]);
      }
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
