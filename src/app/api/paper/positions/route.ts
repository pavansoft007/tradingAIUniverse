import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, getPositionsWithPnl } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";
import { prisma } from "@/lib/db/prisma";

const ANGEL_BASE = "https://apiconnect.angelone.in";

async function fetchLtpBatch(
  jwt:    string,
  tokens: { exchange: string; token: string }[],
): Promise<Map<string, number>> {
  const byExchange: Record<string, string[]> = {};
  for (const { exchange, token } of tokens) {
    (byExchange[exchange] ||= []).push(token);
  }
  const result = new Map<string, number>();
  await Promise.all(
    Object.entries(byExchange).map(async ([exchange, toks]) => {
      try {
        const res = await fetch(`${ANGEL_BASE}/rest/secure/angelbroking/market/v1/quote/`, {
          method: "POST",
          headers: {
            "Content-Type":    "application/json",
            Accept:            "application/json",
            "X-UserType":      "USER",
            "X-SourceID":      "WEB",
            "X-ClientLocalIP": "127.0.0.1",
            "X-ClientPublicIP":"127.0.0.1",
            "X-MACAddress":    "00:00:00:00:00:00",
            "X-PrivateKey":    process.env.ANGEL_ONE_API_KEY ?? process.env.NEXT_PUBLIC_ANGEL_ONE_API_KEY ?? "",
            Authorization:     `Bearer ${jwt}`,
          },
          body: JSON.stringify({ mode: "LTP", exchangeTokens: { [exchange]: toks } }),
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        for (const item of json?.data?.fetched ?? []) {
          result.set(item.symbolToken ?? item.symboltoken, item.data?.ltp ?? 0);
        }
      } catch { /* skip exchange on error */ }
    }),
  );
  return result;
}

export async function GET(req: NextRequest) {
  const cc  = resolveClientCode(req);
  const jwt = req.headers.get("x-jwt-token");
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  try {
    const wallet    = await getOrCreateWallet(cc);
    const positions = await prisma.position.findMany({ where: { walletId: wallet.id } });
    const tokens    = positions.map((p) => ({ exchange: p.exchange, token: p.symboltoken }));
    const quotes    = jwt && tokens.length ? await fetchLtpBatch(jwt, tokens) : new Map<string, number>();
    const data      = await getPositionsWithPnl(wallet.id, quotes);
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
