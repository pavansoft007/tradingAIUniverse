"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import { ConnectionStatus } from "@/components/features/market/ConnectionStatus";
import { LiveTicker } from "@/components/features/market/LiveTicker";
import { MarketWatchTable } from "@/components/features/market/MarketWatchTable";
import { PageHeader } from "@/components/common/PageHeader";
import { useConnectionStatus, useWatchlistTicks } from "@/hooks/useMarketWatch";
import { EXCHANGE_TYPE, WS_MODE } from "@/types/smartws.types";

const SPOTLIGHT = [
  { symbol: "RELIANCE", token: "2885",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "TCS",      token: "11536", exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "HDFCBANK", token: "1333",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "INFY",     token: "1594",  exchangeType: EXCHANGE_TYPE.NSE_CM },
];

// ── Market stats strip ────────────────────────────────────────────────────────

function MarketStatsStrip() {
  const { watchlist, ticks }  = useWatchlistTicks(WS_MODE.QUOTE);
  const connectionStatus      = useConnectionStatus();

  const stats = useMemo(() => {
    return watchlist.reduce(
      (acc, item) => {
        const tick = ticks[`${item.exchangeType}_${item.token}`];
        if (!tick?.close || tick.close === 0) return acc;
        const change = tick.ltp - tick.close;
        if (change > 0) acc.gainers++;
        else if (change < 0) acc.losers++;
        else acc.unchanged++;
        return acc;
      },
      { gainers: 0, losers: 0, unchanged: 0 },
    );
  }, [watchlist, ticks]);

  const total = stats.gainers + stats.losers + stats.unchanged;
  const now   = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2,
        py: 1,
        mb: 2.5,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        flexWrap: "wrap",
      }}
    >
      <ConnectionStatus status={connectionStatus} />

      {total > 0 && (
        <>
          <Box
            sx={{ width: 1, height: 16, bgcolor: "divider", display: { xs: "none", sm: "block" } }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 14, color: "success.main" }} />
            <Typography variant="caption" fontWeight={700} color="success.main">
              {stats.gainers} Gainers
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingDownIcon sx={{ fontSize: 14, color: "error.main" }} />
            <Typography variant="caption" fontWeight={700} color="error.main">
              {stats.losers} Decliners
            </Typography>
          </Box>

          {/* Visual breadth progress bar */}
          <Box
            sx={{
              flex: 1,
              minWidth: 100,
              height: 6,
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "action.hover",
              display: "flex",
            }}
          >
            {stats.gainers > 0 && (
              <Box
                sx={{
                  width: `${(stats.gainers / total) * 100}%`,
                  bgcolor: "success.main",
                  transition: "width 0.5s ease",
                }}
              />
            )}
            {stats.unchanged > 0 && (
              <Box
                sx={{
                  width: `${(stats.unchanged / total) * 100}%`,
                  bgcolor: "grey.500",
                }}
              />
            )}
            {stats.losers > 0 && (
              <Box
                sx={{
                  width: `${(stats.losers / total) * 100}%`,
                  bgcolor: "error.main",
                  transition: "width 0.5s ease",
                }}
              />
            )}
          </Box>
        </>
      )}

      <Box
        sx={{
          ml: "auto",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ShowChartIcon sx={{ fontSize: 13, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            {watchlist.length} symbols
          </Typography>
        </Box>
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 13, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            {now} IST
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketsClient() {
  return (
    <>
      <PageHeader
        title="Markets"
        subtitle="Real-time streaming via Angel One SmartAPI"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Markets" }]}
      />

      {/* Live stats strip */}
      <MarketStatsStrip />

      {/* Spotlight tickers */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {SPOTLIGHT.map((item) => (
          <Grid key={item.token} size={{ xs: 6, sm: 3 }}>
            <LiveTicker
              symbol={item.symbol}
              token={item.token}
              exchangeType={item.exchangeType}
              mode={WS_MODE.QUOTE}
            />
          </Grid>
        ))}
      </Grid>

      {/* Full market watch table */}
      <MarketWatchTable />
    </>
  );
}
