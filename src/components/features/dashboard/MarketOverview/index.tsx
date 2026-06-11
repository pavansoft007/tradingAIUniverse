"use client";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import WifiOffIcon      from "@mui/icons-material/WifiOff";
import Box              from "@mui/material/Box";
import Card             from "@mui/material/Card";
import CardContent      from "@mui/material/CardContent";
import Chip             from "@mui/material/Chip";
import Skeleton         from "@mui/material/Skeleton";
import Tooltip          from "@mui/material/Tooltip";
import Typography       from "@mui/material/Typography";
import { useMemo }      from "react";
import {
  useWatchlistTicks,
  useWatchlistQuotes,
  useWatchlistSymbolMap,
  useConnectionStatus,
} from "@/hooks/useMarketWatch";
import { WS_MODE }      from "@/types/smartws.types";
import type { Tick }    from "@/types/smartws.types";

// ── Static name lookup ────────────────────────────────────────────────────────

const SYMBOL_NAMES: Record<string, string> = {
  RELIANCE:   "Reliance Industries",
  TCS:        "Tata Consultancy",
  HDFCBANK:   "HDFC Bank",
  INFY:       "Infosys",
  ICICIBANK:  "ICICI Bank",
  SBIN:       "State Bank of India",
  BHARTIARTL: "Bharti Airtel",
  ITC:        "ITC Ltd",
  KOTAKBANK:  "Kotak Mahindra Bank",
  WIPRO:      "Wipro",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(p: number) {
  return `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Ticker row ────────────────────────────────────────────────────────────────

interface TickerRowProps {
  symbol:        string;
  name:          string;
  price:         number;
  changePercent: number;
  /** true = WebSocket tick, "rest" = REST poll, false = no data */
  source:        boolean | "rest";
}

function TickerRow({ symbol, name, price, changePercent, source }: TickerRowProps) {
  const isUp  = changePercent >= 0;
  const color = isUp ? "#00D97E" : "#F23645";
  const Icon  = isUp ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2.5,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
        "&:hover": { background: "rgba(255,255,255,0.02)", cursor: "pointer" },
        transition: "background 0.15s",
      }}
    >
      {/* Symbol badge */}
      <Box
        sx={{
          width: 34, height: 34,
          borderRadius: "9px",
          background: `${color}14`,
          border: `1px solid ${color}25`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          mr: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 10, fontWeight: 800, color, letterSpacing: "-0.01em" }}>
          {symbol.slice(0, 3)}
        </Typography>
      </Box>

      {/* Name */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }} noWrap>
            {symbol}
          </Typography>
          {source !== false && (
            <Box
              sx={{
                width: 5, height: 5, borderRadius: "50%",
                background: source === true ? "#00D97E" : "#38BDF8",
                flexShrink: 0,
                ...(source === true && {
                  animation: "pulse 2s ease-in-out infinite",
                  "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                }),
              }}
            />
          )}
        </Box>
        <Typography sx={{ fontSize: 11, color: "text.secondary" }} noWrap>{name}</Typography>
      </Box>

      {/* Price + change */}
      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
          {price > 0 ? fmt(price) : "–"}
        </Typography>
        {price > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.4 }}>
            <Icon sx={{ fontSize: 11, color }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color }}>
              {isUp ? "+" : ""}{changePercent.toFixed(2)}%
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonTickerRow() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: "9px" }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="60%" height={12} />
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Skeleton width={70} height={14} />
        <Skeleton width={50} height={12} />
      </Box>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MarketOverview() {
  const { watchlist, ticks } = useWatchlistTicks(WS_MODE.QUOTE);
  const wsStatus  = useConnectionStatus();
  const isWsLive  = wsStatus === "connected";

  // REST polling — provides real prices when WebSocket is not connected
  const restQuotes    = useWatchlistQuotes();    // Map<symbolToken, AngelQuote>
  const symbolByToken = useWatchlistSymbolMap(); // Map<token, symbol>

  // Build a map: symbol → WebSocket tick
  const symbolToTick = useMemo<Map<string, Tick>>(() => {
    const map = new Map<string, Tick>();
    watchlist.forEach((item) => {
      const tick = ticks[`${item.exchangeType}_${item.token}`];
      if (tick) map.set(item.symbol, tick);
    });
    return map;
  }, [watchlist, ticks]);

  // Build a map: symbol → REST quote
  const symbolToQuote = useMemo(() => {
    const map = new Map<string, { ltp: number; close: number }>();
    restQuotes.forEach((q, token) => {
      const symbol = symbolByToken.get(token);
      if (symbol && q.ltp) map.set(symbol, { ltp: q.ltp, close: q.close });
    });
    return map;
  }, [restQuotes, symbolByToken]);

  // Merge: WS tick (real-time) → REST quote (5 s poll) → no data (skeleton)
  const rows = useMemo(() => {
    return watchlist.slice(0, 10).map((item) => {
      const { symbol } = item;
      const name       = SYMBOL_NAMES[symbol] ?? symbol;
      const tick       = symbolToTick.get(symbol);
      const quote      = symbolToQuote.get(symbol);

      if (tick?.ltp) {
        const ltp       = tick.ltp;
        const prevClose = tick.close ?? ltp;
        const chgPct    = prevClose > 0 ? ((ltp - prevClose) / prevClose) * 100 : 0;
        return { symbol, name, price: ltp, changePercent: chgPct, source: true as const };
      }

      if (quote?.ltp) {
        const ltp       = quote.ltp;
        const prevClose = quote.close ?? ltp;
        const chgPct    = prevClose > 0 ? ((ltp - prevClose) / prevClose) * 100 : 0;
        return { symbol, name, price: ltp, changePercent: chgPct, source: "rest" as const };
      }

      return { symbol, name, price: 0, changePercent: 0, source: false as const };
    });
  }, [watchlist, symbolToTick, symbolToQuote]);

  const liveCount = rows.filter((r) => r.source === true).length;
  const restCount = rows.filter((r) => r.source === "rest").length;
  const hasData   = rows.some((r) => r.price > 0);

  return (
    <Card sx={{ height: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          px: 2.5, py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Market Overview
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.25 }}>
            {liveCount > 0
              ? `${liveCount} live via WebSocket`
              : restCount > 0
              ? `${restCount} via REST (5 s)`
              : "Fetching market data…"}
          </Typography>
        </Box>

        <Tooltip
          title={
            isWsLive
              ? "Real-time prices via WebSocket"
              : restCount > 0
              ? "WebSocket offline — showing live REST prices (5 s delay)"
              : "Connecting to market data feed…"
          }
          placement="left"
        >
          <Chip
            label={isWsLive ? "WS Live" : restCount > 0 ? "REST Live" : "Connecting"}
            size="small"
            icon={
              isWsLive || restCount > 0
                ? (
                  <Box
                    component="span"
                    sx={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: isWsLive ? "#00D97E" : "#38BDF8",
                      display: "inline-block",
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                      ml: "6px !important", mr: "-2px !important",
                    }}
                  />
                )
                : <WifiOffIcon sx={{ fontSize: "12px !important", ml: "4px !important" }} />
            }
            sx={{
              height: 22, fontSize: 10, fontWeight: 700,
              background:  isWsLive ? "rgba(0,217,126,0.12)" : restCount > 0 ? "rgba(56,189,248,0.12)" : "rgba(245,158,11,0.10)",
              color:       isWsLive ? "#00D97E"               : restCount > 0 ? "#38BDF8"               : "#F59E0B",
              border:      isWsLive ? "1px solid rgba(0,217,126,0.25)" : restCount > 0 ? "1px solid rgba(56,189,248,0.25)" : "1px solid rgba(245,158,11,0.25)",
            }}
          />
        </Tooltip>
      </Box>

      <CardContent sx={{ p: 0 }}>
        {!hasData
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonTickerRow key={i} />)
          : rows.map((r) => (
              <TickerRow
                key={r.symbol}
                symbol={r.symbol}
                name={r.name}
                price={r.price}
                changePercent={r.changePercent}
                source={r.source}
              />
            ))}
      </CardContent>
    </Card>
  );
}
