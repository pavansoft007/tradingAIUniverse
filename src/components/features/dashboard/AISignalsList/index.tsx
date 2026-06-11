"use client";

import AutoAwesomeIcon      from "@mui/icons-material/AutoAwesome";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import TrendingDownIcon      from "@mui/icons-material/TrendingDown";
import TrendingUpIcon        from "@mui/icons-material/TrendingUp";
import WifiOffIcon           from "@mui/icons-material/WifiOff";
import Box                  from "@mui/material/Box";
import Card                 from "@mui/material/Card";
import CardContent          from "@mui/material/CardContent";
import Chip                 from "@mui/material/Chip";
import LinearProgress       from "@mui/material/LinearProgress";
import Skeleton             from "@mui/material/Skeleton";
import Tooltip              from "@mui/material/Tooltip";
import Typography           from "@mui/material/Typography";
import { useMemo }          from "react";
import {
  useWatchlistTicks,
  useWatchlistQuotes,
  useWatchlistSymbolMap,
  useConnectionStatus,
} from "@/hooks/useMarketWatch";
import type { AISignal }   from "@/types/market.types";
import { WS_MODE }         from "@/types/smartws.types";

// ── Config ────────────────────────────────────────────────────────────────────

const SIGNAL_CONFIG = {
  buy:  { label: "BUY",  color: "#00D97E", bg: "rgba(0,217,126,0.12)",  border: "rgba(0,217,126,0.25)",  Icon: TrendingUpIcon },
  sell: { label: "SELL", color: "#F23645", bg: "rgba(242,54,69,0.12)",  border: "rgba(242,54,69,0.25)",  Icon: TrendingDownIcon },
  hold: { label: "HOLD", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", Icon: FiberManualRecordIcon },
} as const;

// ── Signal generation from live prices ────────────────────────────────────────

function reason(signal: "buy" | "sell" | "hold", chgPct: number): string {
  const abs = Math.abs(chgPct).toFixed(2);
  if (signal === "buy") {
    if (chgPct > 3)   return `Strong upward momentum, up ${abs}% from prev close`;
    if (chgPct > 1.5) return `Positive momentum, ${abs}% above prev close`;
    return `Mild bullish move, ${abs}% above prev close`;
  }
  if (signal === "sell") {
    if (chgPct < -3)   return `Heavy selling pressure, down ${abs}% from prev close`;
    if (chgPct < -1.5) return `Bearish momentum, ${abs}% below prev close`;
    return `Mild weakness, ${abs}% below prev close`;
  }
  return `Consolidating near prev close (${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%)`;
}

function generateSignals(
  items: Array<{ symbol: string; ltp: number; prevClose: number }>,
): AISignal[] {
  return items.map(({ symbol, ltp, prevClose }, idx) => {
    const chgPct = prevClose > 0 ? ((ltp - prevClose) / prevClose) * 100 : 0;

    const signal: "buy" | "sell" | "hold" =
      chgPct > 0.8 ? "buy" : chgPct < -0.8 ? "sell" : "hold";

    const confidence = Math.min(0.95, Math.max(0.50, 0.50 + Math.abs(chgPct) * 0.10));

    const [targetPrice, stopLoss] =
      signal === "buy"
        ? [ltp * 1.05, ltp * 0.97]
        : signal === "sell"
        ? [ltp * 0.95, ltp * 1.03]
        : [ltp * 1.03, ltp * 0.97];

    return {
      id:          `live-${idx}`,
      symbol,
      signal,
      confidence:  Math.round(confidence * 100) / 100,
      targetPrice: Math.round(targetPrice),
      stopLoss:    Math.round(stopLoss),
      timeframe:   "1d" as const,
      reasoning:   reason(signal, chgPct),
      createdAt:   new Date().toISOString(),
    };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SignalRow({ signal }: { signal: AISignal }) {
  const cfg  = SIGNAL_CONFIG[signal.signal] ?? SIGNAL_CONFIG.hold;
  const Icon = cfg.Icon;
  const pct  = Math.round(signal.confidence * 100);

  return (
    <Box
      sx={{
        px: 2.5, py: 1.75,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        "&:last-child": { borderBottom: "none" },
        "&:hover": { background: "rgba(255,255,255,0.02)" },
        transition: "background 0.15s",
        cursor: "pointer",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 26, height: 26, borderRadius: "7px",
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 13, color: cfg.color }} />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {signal.symbol}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box sx={{ px: 0.75, py: 0.2, borderRadius: "5px", background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: cfg.color, letterSpacing: "0.06em" }}>
              {cfg.label}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: "monospace" }}>
            {pct}%
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          mb: 1,
          "& .MuiLinearProgress-bar": {
            background: `linear-gradient(90deg, ${cfg.color} 0%, ${cfg.color}88 100%)`,
          },
          background: `${cfg.color}15`,
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
          Target{" "}
          <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: "#00D97E", fontFamily: "monospace" }}>
            ₹{signal.targetPrice.toLocaleString("en-IN")}
          </Typography>
        </Typography>
        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
          Stop{" "}
          <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: "#F23645", fontFamily: "monospace" }}>
            ₹{signal.stopLoss.toLocaleString("en-IN")}
          </Typography>
        </Typography>
      </Box>

      <Typography sx={{ fontSize: 10.5, color: "text.secondary", fontStyle: "italic" }}>
        {signal.reasoning}
      </Typography>
    </Box>
  );
}

function SkeletonRow() {
  return (
    <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <Skeleton width="45%" height={14} sx={{ mb: 1 }} />
      <Skeleton width="100%" height={6} sx={{ borderRadius: 1, mb: 1 }} />
      <Skeleton width="70%" height={12} />
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AISignalsList() {
  const { watchlist, ticks } = useWatchlistTicks(WS_MODE.QUOTE);
  const wsStatus  = useConnectionStatus();
  const isWsLive  = wsStatus === "connected";

  // REST polling fallback — provides real prices when WS isn't delivering ticks
  const restQuotes    = useWatchlistQuotes();    // Map<symbolToken, AngelQuote>
  const symbolByToken = useWatchlistSymbolMap(); // Map<token, symbol>

  const signals = useMemo<AISignal[]>(() => {
    // Priority 1: items with live WebSocket ticks
    const wsItems: Array<{ symbol: string; ltp: number; prevClose: number }> = [];
    watchlist.forEach((item) => {
      const tick = ticks[`${item.exchangeType}_${item.token}`];
      if (tick?.ltp) {
        wsItems.push({
          symbol:    item.symbol,
          ltp:       tick.ltp,
          prevClose: tick.close ?? tick.ltp,
        });
      }
    });

    if (wsItems.length > 0) {
      return generateSignals(wsItems)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
    }

    // Priority 2: REST quote poll — real prices with 5 s delay
    const restItems: Array<{ symbol: string; ltp: number; prevClose: number }> = [];
    restQuotes.forEach((q, token) => {
      const symbol = symbolByToken.get(token);
      if (symbol && q.ltp) {
        restItems.push({ symbol, ltp: q.ltp, prevClose: q.close ?? q.ltp });
      }
    });

    if (restItems.length > 0) {
      return generateSignals(restItems)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
    }

    return [];
  }, [watchlist, ticks, restQuotes, symbolByToken]);

  const wsLiveCount   = watchlist.filter((item) => !!ticks[`${item.exchangeType}_${item.token}`]?.ltp).length;
  const restLiveCount = restQuotes.size;
  const isLoading     = signals.length === 0;
  const signalSource  = wsLiveCount > 0 ? "ws" : restLiveCount > 0 ? "rest" : "loading";

  return (
    <Card sx={{ height: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          px: 2.5, py: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 28, height: 28, borderRadius: "8px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.2) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 10px rgba(99,102,241,0.3)",
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 14, color: "#818CF8" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
              AI Signals
            </Typography>
            {signalSource !== "loading" && (
              <Typography sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1 }}>
                {signalSource === "ws"
                  ? `${wsLiveCount} live WebSocket tick${wsLiveCount > 1 ? "s" : ""}`
                  : `${restLiveCount} via REST (5 s)`}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip
            title={
              isWsLive
                ? "Signals generated from live WebSocket ticks"
                : signalSource === "rest"
                ? "WebSocket offline — signals from REST prices (5 s delay)"
                : "Fetching market data…"
            }
            placement="left"
          >
            <Chip
              label={isWsLive ? "Live" : signalSource === "rest" ? "REST" : "Loading"}
              size="small"
              icon={
                signalSource !== "loading"
                  ? (
                    <Box component="span" sx={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: isWsLive ? "#00D97E" : "#38BDF8",
                      display: "inline-block",
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                      ml: "6px !important", mr: "-2px !important",
                    }} />
                  )
                  : <WifiOffIcon sx={{ fontSize: "12px !important", ml: "4px !important" }} />
              }
              sx={{
                height: 22, fontSize: 10, fontWeight: 700,
                background:  isWsLive ? "rgba(0,217,126,0.12)" : signalSource === "rest" ? "rgba(56,189,248,0.12)" : "rgba(245,158,11,0.10)",
                color:       isWsLive ? "#00D97E"               : signalSource === "rest" ? "#38BDF8"               : "#F59E0B",
                border:      isWsLive
                  ? "1px solid rgba(0,217,126,0.25)"
                  : signalSource === "rest"
                  ? "1px solid rgba(56,189,248,0.25)"
                  : "1px solid rgba(245,158,11,0.25)",
              }}
            />
          </Tooltip>
          {signals.length > 0 && (
            <Chip
              label={`${signals.length} Active`}
              size="small"
              sx={{
                height: 22, fontSize: 10, fontWeight: 700,
                background: "rgba(99,102,241,0.15)",
                color: "#818CF8",
                border: "1px solid rgba(99,102,241,0.25)",
              }}
            />
          )}
        </Box>
      </Box>

      <CardContent sx={{ p: 0 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          : signals.map((signal) => <SignalRow key={signal.id} signal={signal} />)
        }
      </CardContent>
    </Card>
  );
}
