"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutoGraphIcon  from "@mui/icons-material/AutoGraph";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box            from "@mui/material/Box";
import Card           from "@mui/material/Card";
import Chip           from "@mui/material/Chip";
import Grid           from "@mui/material/Grid";
import Skeleton       from "@mui/material/Skeleton";
import Tab            from "@mui/material/Tab";
import Tabs           from "@mui/material/Tabs";
import Tooltip        from "@mui/material/Tooltip";
import Typography     from "@mui/material/Typography";
import { useState }                     from "react";
import { PageHeader }                   from "@/components/common/PageHeader";
import { StatCard }                     from "@/components/common/StatCard";
import { LivePositionsTable }           from "@/components/features/portfolio/LivePositionsTable";
import { PortfolioAllocationChart }     from "@/components/features/portfolio/PortfolioAllocationChart";
import { PositionsTable }               from "@/components/features/portfolio/PositionsTable";
import { useConnectionStatus }          from "@/hooks/useMarketWatch";
import { useHoldings }                  from "@/hooks/usePortfolio";

export default function PortfolioClient() {
  const [tab, setTab] = useState<"holdings" | "positions">("holdings");
  const { data: holdingsData, isLoading } = useHoldings();
  const wsStatus = useConnectionStatus();
  const th = holdingsData?.totalholding;

  const totalValue  = th?.totalholdingvalue    ?? 0;
  const totalPnL    = th?.totalprofitandloss    ?? 0;
  const pnlPct      = th?.totalpnlpercentage    ?? 0;
  const invested    = th ? totalValue - totalPnL : 0;
  const isUp        = totalPnL >= 0;

  const STATS = [
    {
      title:    "Total Value",
      value:    totalValue,
      prefix:   "₹",
      icon:     <AccountBalanceWalletOutlinedIcon />,
      iconColor:"#6366F1",
    },
    {
      title:       "Total P&L",
      value:       Math.abs(totalPnL),
      prefix:      isUp ? "+₹" : "-₹",
      change:      pnlPct,
      changeLabel: "unrealized",
      icon:        <TrendingUpIcon />,
      iconColor:   "#00D97E",
    },
    {
      title:    "Invested",
      value:    invested,
      prefix:   "₹",
      icon:     <AccountBalanceWalletOutlinedIcon />,
      iconColor:"#F59E0B",
    },
    {
      title:    "Holdings",
      value:    holdingsData?.holdings?.filter((h) => h.quantity > 0).length ?? 0,
      icon:     <AutoGraphIcon />,
      iconColor:"#38BDF8",
    },
  ];

  return (
    <>
      <PageHeader
        title="Portfolio"
        subtitle="Manage and monitor your holdings and positions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Portfolio" }]}
      />

      {/* KPI strip */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {STATS.map((s) => (
          <Grid key={s.title} size={{ xs: 12, sm: 6, md: 3 }}>
            {isLoading
              ? <Skeleton variant="rounded" height={110} />
              : <StatCard {...s} />}
          </Grid>
        ))}
      </Grid>

      {/* Table + Allocation chart */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ overflow: "hidden" }}>
            {/* Tab header */}
            <Box
              sx={{
                px: 2.5,
                pt: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v as typeof tab)}
                sx={{
                  minHeight: 36,
                  "& .MuiTab-root": { minHeight: 36, fontSize: 13, fontWeight: 600, py: 0.5 },
                }}
              >
                <Tab label="Holdings" value="holdings" />
                <Tab label="Positions" value="positions" />
              </Tabs>

              {tab === "holdings" && (() => {
                const isWsLive = wsStatus === "connected";
                const dotColor = isWsLive ? "#00D97E" : "#F59E0B";
                const label    = isWsLive ? "WS Live" : "Polling 3s";
                const tooltip  = isWsLive
                  ? "Real-time prices via WebSocket"
                  : "Prices refreshed every 3 seconds via REST API";
                return (
                  <Tooltip title={tooltip} placement="left">
                    <Chip
                      label={label}
                      size="small"
                      icon={
                        <Box
                          component="span"
                          sx={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: dotColor, display: "inline-block",
                            animation: "pulse 1.5s ease-in-out infinite",
                            "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                            ml: "6px !important", mr: "-2px !important",
                          }}
                        />
                      }
                      sx={{
                        height: 22, fontSize: 10, fontWeight: 700,
                        background: isWsLive ? "rgba(0,217,126,0.12)" : "rgba(245,158,11,0.12)",
                        color: dotColor,
                        border: `1px solid ${isWsLive ? "rgba(0,217,126,0.25)" : "rgba(245,158,11,0.25)"}`,
                        mb: 0.5,
                      }}
                    />
                  </Tooltip>
                );
              })()}

              {tab === "positions" && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Intraday &amp; F&amp;O open positions
                </Typography>
              )}
            </Box>

            {/* Tab panels */}
            {tab === "holdings" && <LivePositionsTable />}
            {tab === "positions" && <PositionsTable />}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <PortfolioAllocationChart />
        </Grid>
      </Grid>
    </>
  );
}
