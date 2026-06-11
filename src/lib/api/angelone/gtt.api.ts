/**
 * Angel One SmartAPI — Good Till Triggered (GTT) endpoints.
 *
 * Constraints:
 *   - Exchange: NSE and BSE only
 *   - Product type: DELIVERY and MARGIN only
 *   - Time period: 1–365 days
 *
 * Endpoints are POST even for reads (Angel One convention for GTT).
 */

import orderProxyClient from "@/lib/api/orderProxyClient";
import type { AngelApiResponse } from "@/types/angel-order.types";
import type {
  CreateGTTRequest,
  GTTListRequest,
  GTTRule,
  ModifyGTTRequest,
} from "@/types/angel-gtt.types";

function assertGTTOk<T>(res: AngelApiResponse<T>, ctx: string): T {
  if (!res.status) {
    throw Object.assign(new Error(`${ctx}: ${res.message || "GTT request failed"}`), {
      errorcode:  res.errorcode,
      angelError: true,
    });
  }
  return res.data;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createGTTRule(req: CreateGTTRequest): Promise<{ id: number }> {
  const { data } = await orderProxyClient.post<AngelApiResponse<{ id: number } | null>>(
    "/rest/secure/angelbroking/gtt/v1/createRule",
    req,
  );
  return assertGTTOk(data, "createGTTRule") as { id: number };
}

// ── Modify ────────────────────────────────────────────────────────────────────

export async function modifyGTTRule(req: ModifyGTTRequest): Promise<{ id: number }> {
  const { data } = await orderProxyClient.post<AngelApiResponse<{ id: number } | null>>(
    "/rest/secure/angelbroking/gtt/v1/modifyRule",
    req,
  );
  return assertGTTOk(data, "modifyGTTRule") as { id: number };
}

// ── Cancel ────────────────────────────────────────────────────────────────────

export async function cancelGTTRule(id: number): Promise<{ id: number }> {
  const { data } = await orderProxyClient.post<AngelApiResponse<{ id: number } | null>>(
    "/rest/secure/angelbroking/gtt/v1/cancelRule",
    { id },
  );
  return assertGTTOk(data, "cancelGTTRule") as { id: number };
}

// ── Rule details ──────────────────────────────────────────────────────────────

export async function getGTTRuleDetails(id: number): Promise<GTTRule> {
  const { data } = await orderProxyClient.post<AngelApiResponse<GTTRule | null>>(
    "/rest/secure/angelbroking/gtt/v1/ruleDetails",
    { id },
  );
  return assertGTTOk(data, "getGTTRuleDetails") as GTTRule;
}

// ── Rule list ─────────────────────────────────────────────────────────────────

export async function getGTTRuleList(req: GTTListRequest = {}): Promise<GTTRule[]> {
  const { data } = await orderProxyClient.post<AngelApiResponse<GTTRule[] | null>>(
    "/rest/secure/angelbroking/gtt/v1/ruleList",
    {
      status: req.status ?? ["NEW", "ACTIVE"],
      page:   req.page   ?? 1,
      count:  req.count  ?? 50,
    },
  );
  // AB1006 = no data found — treat as empty list
  if (!data.status && data.errorcode !== "AB1006") {
    assertGTTOk(data, "getGTTRuleList");
  }
  return data.data ?? [];
}
