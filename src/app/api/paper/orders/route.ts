import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, placeOrder, getOrders } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";
import type { PlaceOrderRequest } from "@/types/paper-trading.types";

const ANGEL_BASE = "https://apiconnect.angelone.in";

async function fetchLtp(jwt: string, exchange: string, symboltoken: string): Promise<number> {
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
    body: JSON.stringify({ mode: "LTP", exchangeTokens: { [exchange]: [symboltoken] } }),
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const json = await res.json().catch(() => null);
  return json?.data?.fetched?.[0]?.data?.ltp ?? 0;
}

export async function GET(req: NextRequest) {
  const cc = resolveClientCode(req);
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  try {
    const wallet = await getOrCreateWallet(cc);
    const orders = await getOrders(wallet.id, status);
    return NextResponse.json({ success: true, data: orders });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cc  = resolveClientCode(req);
  const jwt = req.headers.get("x-jwt-token");
  if (!cc) {
    return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  }
  const body: PlaceOrderRequest = await req.json().catch(() => null);
  if (!body?.tradingsymbol || !body?.symboltoken) {
    return NextResponse.json({ error: "Invalid order request body" }, { status: 400 });
  }
  try {
    const ltp = jwt ? await fetchLtp(jwt, body.exchange, body.symboltoken) : 0;
    if (!ltp) return NextResponse.json({ error: "Could not fetch live price — ensure you are logged in" }, { status: 400 });

    const wallet = await getOrCreateWallet(cc);
    const order  = await placeOrder(wallet.id, body, ltp);
    return NextResponse.json({ success: true, data: order });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
