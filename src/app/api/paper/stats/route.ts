import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, getTradingStats, getPositionsWithPnl } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";
import { prisma } from "@/lib/db/prisma";

const ANGEL_BASE = "https://apiconnect.angelone.in";

export async function GET(req: NextRequest) {
  const cc  = resolveClientCode(req);
  const jwt = req.headers.get("x-jwt-token");
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  try {
    const wallet    = await getOrCreateWallet(cc);
    const positions = await prisma.position.findMany({ where: { walletId: wallet.id } });

    const quotes = new Map<string, number>();
    if (jwt && positions.length) {
      const byExchange: Record<string, string[]> = {};
      for (const p of positions) (byExchange[p.exchange] ||= []).push(p.symboltoken);
      for (const [exchange, tokens] of Object.entries(byExchange)) {
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
          body: JSON.stringify({ mode: "LTP", exchangeTokens: { [exchange]: tokens } }),
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        for (const item of json?.data?.fetched ?? []) {
          quotes.set(item.symbolToken ?? item.symboltoken, item.data?.ltp ?? 0);
        }
      }
    }

    const positionsWithPnl = await getPositionsWithPnl(wallet.id, quotes);
    const unrealizedPnl    = positionsWithPnl.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const stats            = await getTradingStats(wallet.id, unrealizedPnl);
    return NextResponse.json({ success: true, data: stats });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
