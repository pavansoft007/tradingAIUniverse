import { NextRequest } from "next/server";

/**
 * Resolves the Angel One clientCode from an incoming API request.
 *
 * Priority:
 *   1. x-client-code header (set explicitly by our hooks)
 *   2. JWT payload — Angel One embeds `clientcode` / `sub` in the token
 *      (handles existing sessions where localStorage wasn't written yet)
 */
export function resolveClientCode(req: NextRequest): string | null {
  const fromHeader = req.headers.get("x-client-code");
  if (fromHeader) return fromHeader;

  const jwt =
    req.headers.get("x-jwt-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"),
    );
    // Log JWT claims once to diagnose missing clientCode (visible in Next.js server console)
    if (process.env.NODE_ENV === "development") {
      console.log("[paper] JWT payload keys:", Object.keys(payload));
    }
    return (
      (payload.clientcode  as string | undefined) ??
      (payload.clientCode  as string | undefined) ??
      (payload.ClientCode  as string | undefined) ??
      (payload.client_code as string | undefined) ??
      (payload.sub         as string | undefined) ??
      null
    );
  } catch {
    return null;
  }
}
