/**
 * Server-side SSE proxy for Angel One SmartAPI WebSocket2.
 *
 * Why: Browsers cannot set custom HTTP headers on WebSocket connections.
 * WebSocket2 requires Authorization, x-api-key, x-client-code, x-feed-token
 * as HTTP headers. This route runs server-side (Node.js), connects to Angel One
 * with the correct headers using the `ws` package, and forwards binary tick data
 * to the browser as base64-encoded Server-Sent Events.
 *
 * Subscription params come in via URL query string so EventSource can connect
 * without custom headers. The JWT is passed as the `jwt` query param (same origin,
 * not exposed to third-party servers).
 *
 * Binary ticks → base64 SSE → browser decodes → existing binaryParser handles them.
 */

export const runtime = "nodejs";

import { NextRequest } from "next/server";
import WebSocket from "ws";

const ANGEL_WS_URL  = "wss://smartapisocket.angelone.in/smart-stream";
const HEARTBEAT_MS  = 10_000;   // Angel One WebSocket2 requires 10s heartbeat

interface TokenGroup {
  exchangeType: number;
  tokens: string[];
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // Credentials — JWT comes as query param (same-origin, acceptable)
  const jwt        = sp.get("jwt")        ?? "";
  const feedToken  = sp.get("feedToken")  ?? "";
  const clientCode = sp.get("clientCode") ?? "";
  const apiKey     = sp.get("apiKey")     ??
    process.env.ANGEL_ONE_API_KEY         ??
    process.env.NEXT_PUBLIC_ANGEL_ONE_API_KEY ?? "";
  const mode       = Number(sp.get("mode") ?? "1");

  let tokenList: TokenGroup[];
  try {
    tokenList = JSON.parse(sp.get("tokens") ?? "[]");
  } catch {
    return new Response("Bad tokens param", { status: 400 });
  }

  if (!jwt || !feedToken || !clientCode || tokenList.length === 0) {
    return new Response("Missing credentials or tokens", { status: 400 });
  }

  const enc = new TextEncoder();

  // Each request opens its own server-side WebSocket to Angel One.
  // The SSE stream lives as long as the client is connected.
  let wsConn:         WebSocket       | null = null;
  let heartbeatTimer: NodeJS.Timeout  | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      try {
        wsConn = new WebSocket(ANGEL_WS_URL, {
          headers: {
            Authorization:    jwt,
            "x-api-key":      apiKey,
            "x-client-code":  clientCode,
            "x-feed-token":   feedToken,
          },
        });

        wsConn.on("open", () => {
          // Subscribe to requested tokens
          wsConn!.send(JSON.stringify({
            correlationID: "sse-stream",
            action: 1,
            params: { mode, tokenList },
          }));

          // Heartbeat — Angel One requires a ping every 10 seconds
          heartbeatTimer = setInterval(() => {
            if (wsConn?.readyState === WebSocket.OPEN) wsConn.send("ping");
          }, HEARTBEAT_MS);

          // Signal connected to client
          ctrl.enqueue(enc.encode("event: open\ndata: connected\n\n"));
        });

        wsConn.on("message", (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
          if (!isBinary) return;   // skip text ACKs like "pong"
          const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
          ctrl.enqueue(enc.encode(`data: ${buf.toString("base64")}\n\n`));
        });

        wsConn.on("error", (err) => {
          ctrl.enqueue(enc.encode(`event: error\ndata: ${err.message}\n\n`));
          cleanup();
          try { ctrl.close(); } catch { /* already closed */ }
        });

        wsConn.on("close", () => {
          cleanup();
          try { ctrl.close(); } catch { /* already closed */ }
        });

      } catch (err) {
        ctrl.enqueue(enc.encode(`event: error\ndata: ${String(err)}\n\n`));
        try { ctrl.close(); } catch { /* already closed */ }
      }
    },

    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (wsConn && wsConn.readyState < WebSocket.CLOSING) {
      wsConn.close(1000, "Client disconnected");
    }
    wsConn = null;
  }

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",   // Disable nginx buffering
    },
  });
}
