import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, checkPendingOrders } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";

export async function POST(req: NextRequest) {
  const cc = resolveClientCode(req);
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  const body: { quotes: Record<string, number> } = await req.json().catch(() => ({ quotes: {} }));
  const quotesMap = new Map(Object.entries(body.quotes ?? {}));
  try {
    const wallet = await getOrCreateWallet(cc);
    await checkPendingOrders(wallet.id, quotesMap);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
