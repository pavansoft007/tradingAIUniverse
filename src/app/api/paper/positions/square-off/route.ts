import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, squareOffMisPositions } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";
import { prisma } from "@/lib/db/prisma";

const ANGEL_BASE = "https://apiconnect.angelone.in";

export async function POST(req: NextRequest) {
  const cc  = resolveClientCode(req);
  const jwt = req.headers.get("x-jwt-token");
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  try {
    const wallet    = await getOrCreateWallet(cc);
    const positions = await prisma.position.findMany({
      where: { walletId: wallet.id, producttype: "MIS" },
    });
    const byExchange: Record<string, string[]> = {};
    for (const pos of positions) {
      (byExchange[pos.exchange] ||= []).push(pos.symboltoken);
    }
    const quotes = new Map<string, number>();
    if (jwt) {
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
    await squareOffMisPositions(wallet.id, quotes);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
