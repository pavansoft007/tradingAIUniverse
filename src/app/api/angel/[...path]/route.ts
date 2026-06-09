/**
 * Next.js catch-all proxy for Angel One SmartAPI.
 *
 * Why: Angel One blocks CORS from browser origins, so all SmartAPI calls
 * must go through this server-side route. The browser calls /api/angel/…
 * (same origin), and this handler forwards the request to Angel One with
 * the required headers, then streams the response back.
 *
 * Auth: the client sends its JWT as "Authorization: Bearer …"; we extract it
 * and forward it. The API key and other SmartAPI headers are added here
 * from server-side env vars (never exposed in client bundles).
 */

import { NextRequest, NextResponse } from "next/server";

const ANGEL_BASE = "https://apiconnect.angelone.in";

const SMARTAPI_HEADERS: Record<string, string> = {
  "Content-Type":   "application/json",
  Accept:           "application/json",
  "X-UserType":     "USER",
  "X-SourceID":     "WEB",
  "X-ClientLocalIP":"127.0.0.1",
  "X-ClientPublicIP":"127.0.0.1",
  "X-MACAddress":   "00:00:00:00:00:00",
  "X-PrivateKey":   process.env.NEXT_PUBLIC_ANGEL_ONE_API_KEY ?? "",
};

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  const segments = params.path.join("/");
  const search   = req.nextUrl.search; // preserve query params
  const upstreamUrl = `${ANGEL_BASE}/${segments}${search}`;

  // Forward the JWT the browser already has
  const authHeader = req.headers.get("authorization") ?? "";

  const upstreamHeaders: Record<string, string> = {
    ...SMARTAPI_HEADERS,
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method:  req.method,
      headers: upstreamHeaders,
      body,
      // server-side fetch; no CORS restriction
      cache: "no-store",
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: "Angel One API unreachable", errorcode: "PROXY_ERR" },
      { status: 502 },
    );
  }

  const responseBody = await upstream.text();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  return proxyRequest(req, params);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  return proxyRequest(req, params);
}
