import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, depositToWallet, withdrawFromWallet } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";

export async function GET(req: NextRequest) {
  const cc = resolveClientCode(req);
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  try {
    const wallet = await getOrCreateWallet(cc);
    return NextResponse.json({ success: true, data: wallet });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cc = resolveClientCode(req);
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { action, amount } = body as { action?: string; amount?: number };
  if (!action || !amount || amount <= 0) {
    return NextResponse.json({ error: "action and positive amount required" }, { status: 400 });
  }
  try {
    const wallet = await getOrCreateWallet(cc);
    const updated = action === "deposit"
      ? await depositToWallet(wallet.id, amount)
      : await withdrawFromWallet(wallet.id, amount);
    return NextResponse.json({ success: true, data: updated });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
