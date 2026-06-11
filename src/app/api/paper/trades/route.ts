import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, getTradeJournal } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";

export async function GET(req: NextRequest) {
  const cc = resolveClientCode(req);
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  const page  = parseInt(req.nextUrl.searchParams.get("page")  ?? "1",  10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
  try {
    const wallet = await getOrCreateWallet(cc);
    const result = await getTradeJournal(wallet.id, page, limit);
    return NextResponse.json({ success: true, ...result });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
