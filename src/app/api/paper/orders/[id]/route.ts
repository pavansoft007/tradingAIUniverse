import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWallet, cancelOrder } from "@/lib/paper-trading/service";
import { resolveClientCode } from "@/app/api/paper/_resolveClient";

export async function DELETE(
  req:     NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const cc = resolveClientCode(req);
  if (!cc) return NextResponse.json({ error: "Could not determine client code — please log in again" }, { status: 401 });
  const { id } = await context.params;
  try {
    const wallet = await getOrCreateWallet(cc);
    const order  = await cancelOrder(wallet.id, id);
    return NextResponse.json({ success: true, data: order });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
