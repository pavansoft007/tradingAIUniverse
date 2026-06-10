/**
 * Angel One SmartAPI WebSocket2 client.
 *
 * Connects directly to wss://smartapisocket.angelone.in/smart-stream using
 * query-parameter auth (the same approach as SmartWebSocket v1 which the Angel
 * One server still accepts for browser clients that cannot set HTTP headers).
 *
 * Features
 * ────────
 * - Auto-reconnect with exponential back-off (configurable, default 5 attempts)
 * - 10-second heartbeat  (WebSocket2 spec requires 10 s, not 30 s)
 * - Subscription replay on reconnect
 * - Concurrent subscription de-duplication via correlationID
 * - Binary message parsing via parseBinaryTick
 */

import { parseBinaryTick } from "./binaryParser";
import type {
  SmartWsConfig,
  Tick,
  TokenGroup,
  WsAction,
  WsConnectionStatus,
  WsMode,
} from "@/types/smartws.types";
import { WS_ACTION } from "@/types/smartws.types";

const WS_ENDPOINT   = "wss://smartapisocket.angelone.in/smart-stream";
const HEARTBEAT_MS  = 10_000;   // WebSocket2 spec: ping every 10 s

type TickHandler   = (tick: Tick)                => void;
type StatusHandler = (status: WsConnectionStatus) => void;

export class SmartWebSocket {
  private ws: WebSocket | null = null;
  private config: SmartWsConfig | null = null;
  private _status: WsConnectionStatus = "idle";

  private reconnectAttempts = 0;
  private reconnectTimer:  ReturnType<typeof setTimeout>   | null = null;
  private heartbeatTimer:  ReturnType<typeof setInterval>  | null = null;

  // Subscriptions keyed by correlationID — replayed on reconnect
  private activeSubscriptions = new Map<
    string,
    { groups: TokenGroup[]; mode: WsMode }
  >();

  private tickHandlers   = new Set<TickHandler>();
  private statusHandlers = new Set<StatusHandler>();

  // ── Public API ────────────────────────────────────────────────────────────

  get status(): WsConnectionStatus {
    return this._status;
  }

  connect(config: SmartWsConfig): void {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    this.config = config;
    this.reconnectAttempts = 0;
    this.open();
  }

  disconnect(): void {
    this.clearTimers();
    this.config = null;
    this.activeSubscriptions.clear();
    if (this.ws) {
      this.ws.onclose = null;   // prevent reconnect loop
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  subscribe(groups: TokenGroup[], mode: WsMode): void {
    const id = this.correlationId(groups, mode);
    this.activeSubscriptions.set(id, { groups, mode });
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(groups, mode, WS_ACTION.SUBSCRIBE, id);
    }
  }

  unsubscribe(groups: TokenGroup[], mode: WsMode): void {
    const id = this.correlationId(groups, mode);
    this.activeSubscriptions.delete(id);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(groups, mode, WS_ACTION.UNSUBSCRIBE, id);
    }
  }

  onTick(handler: TickHandler): () => void {
    this.tickHandlers.add(handler);
    return () => this.tickHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private open(): void {
    if (!this.config) return;
    this.setStatus(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");

    try {
      const url = this.buildUrl(this.config);
      this.ws = new WebSocket(url);
      this.ws.binaryType = "arraybuffer";
      this.ws.onopen    = () => this.handleOpen();
      this.ws.onmessage = (e) => this.handleMessage(e);
      this.ws.onclose   = (e) => this.handleClose(e);
      this.ws.onerror   = ()  => this.handleError();
    } catch {
      this.scheduleReconnect();
    }
  }

  private buildUrl(config: SmartWsConfig): string {
    const url = new URL(WS_ENDPOINT);
    url.searchParams.set("clientCode", config.clientCode);
    url.searchParams.set("jwtToken",   config.jwtToken);
    url.searchParams.set("apiKey",     config.apiKey);
    url.searchParams.set("feedToken",  config.feedToken);
    return url.toString();
  }

  private handleOpen(): void {
    this.setStatus("connected");
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.replaySubscriptions();
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data instanceof ArrayBuffer) {
      const tick = parseBinaryTick(event.data);
      if (tick) this.tickHandlers.forEach((h) => h(tick));
    }
    // Text frames (ACKs / pongs) are intentionally ignored
  }

  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat();
    if (event.code === 1000) {
      this.setStatus("disconnected");
      return;
    }
    this.scheduleReconnect();
  }

  private handleError(): void {
    this.setStatus("error");
    this.ws?.close();
  }

  private scheduleReconnect(): void {
    const max = this.config?.maxReconnectAttempts ?? 5;
    if (this.reconnectAttempts >= max) {
      this.setStatus("error");
      return;
    }
    const base  = this.config?.reconnectDelayMs ?? 1_000;
    const delay = base * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    this.setStatus("reconnecting");
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  private replaySubscriptions(): void {
    this.activeSubscriptions.forEach(({ groups, mode }, id) => {
      this.sendSubscription(groups, mode, WS_ACTION.SUBSCRIBE, id);
    });
  }

  private sendSubscription(
    groups: TokenGroup[],
    mode: WsMode,
    action: WsAction,
    correlationID: string,
  ): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({ correlationID, action, params: { mode, tokenList: groups } }),
    );
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send("ping");
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: WsConnectionStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.statusHandlers.forEach((h) => h(status));
  }

  private correlationId(groups: TokenGroup[], mode: WsMode): string {
    const tokens = groups
      .flatMap((g) => g.tokens.map((t) => `${g.exchangeType}:${t}`))
      .sort();
    return `${mode}_${tokens.join(",")}`;
  }
}

// Module-level singleton — one WebSocket connection per browser session
export const smartWs = new SmartWebSocket();
