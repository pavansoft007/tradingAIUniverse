import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, resetWallet } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";

export async function POST(req: NextRequest) {
  const cc = resolveClientCode(req);
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  try {
    const wallet = await getOrCreateWallet(cc);
    const reset  = await resetWallet(wallet.id);
    return NextResponse.json({ success: true, data: reset });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
