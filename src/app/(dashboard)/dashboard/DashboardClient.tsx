"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutoGraphIcon  from "@mui/icons-material/AutoGraph";
import ShowChartIcon  from "@mui/icons-material/ShowChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box            from "@mui/material/Box";
import Grid           from "@mui/material/Grid";
import Skeleton       from "@mui/material/Skeleton";
import Typography     from "@mui/material/Typography";
import { useMemo }                    from "react";
import { AISignalsList }             from "@/components/features/dashboard/AISignalsList";
import { MarketOverview }            from "@/components/features/dashboard/MarketOverview";
import { PortfolioPerformanceChart } from "@/components/features/dashboard/PortfolioPerformanceChart";
import { SectorAllocationChart }     from "@/components/features/dashboard/SectorAllocationChart";
import { StatCard }                  from "@/components/common/StatCard";
import { useAngelOneSession }        from "@/hooks/useAngelOneAuth";
import { useHoldings, useFunds }     from "@/hooks/usePortfolio";
import { useOrderStore }             from "@/store/useOrderStore";

export default function DashboardClient() {
  const { user, clientCode } = useAngelOneSession();
  const name     = user?.name ?? clientCode ?? "Trader";
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { data: holdingsData, isLoading: holdingsLoading } = useHoldings();
  const { data: fundsData,    isLoading: fundsLoading }    = useFunds();
  const allPositions  = useOrderStore((s) => s.positions);
  const openPositions = useMemo(
    () => allPositions.filter((p) => parseInt(p.netqty, 10) !== 0),
    [allPositions],
  );

  const th          = holdingsData?.totalholding;
  const totalValue  = th?.totalholdingvalue    ?? 0;
  const totalPnL    = th?.totalprofitandloss    ?? 0;
  const pnlPct      = th?.totalpnlpercentage    ?? 0;
  const freeCash    = parseFloat(fundsData?.availablecash ?? "0");
  const m2mUnreal   = parseFloat(fundsData?.m2munrealized ?? "0");
  const isUp        = totalPnL >= 0;
  const isLoading   = holdingsLoading || fundsLoading;

  const STATS = [
    {
      title:    "Portfolio Value",
      value:    totalValue,
      change:   pnlPct,
      changeLabel: "overall return",
      prefix:   "₹",
      icon:     <AccountBalanceWalletOutlinedIcon />,
      iconColor:"#6366F1",
    },
    {
      title:       "Unrealized P&L",
      value:       Math.abs(m2mUnreal || totalPnL),
      prefix:      isUp ? "+₹" : "-₹",
      change:      pnlPct,
      changeLabel: "unrealized",
      icon:        <TrendingUpIcon />,
      iconColor:   "#00D97E",
    },
    {
      title:    "Open Positions",
      value:    openPositions.length,
      icon:     <ShowChartIcon />,
      iconColor:"#F59E0B",
    },
    {
      title:    "Free Margin",
      value:    freeCash,
      prefix:   "₹",
      icon:     <AutoGraphIcon />,
      iconColor:"#38BDF8",
    },
  ];

  return (
    <>
      {/* Hero greeting */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: { xs: 22, sm: 28 },
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            background: (t) =>
              t.palette.mode === "dark"
                ? "linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)"
                : "linear-gradient(135deg, #0F172A 0%, #475569 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {greeting}, {name.split(" ")[0]} 👋
        </Typography>
        <Typography sx={{ mt: 0.75, fontSize: 14, color: "text.secondary" }}>
          Here&apos;s your portfolio snapshot for today — NSE session active.
        </Typography>
      </Box>

      {/* KPI strip */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {STATS.map((s) => (
          <Grid key={s.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            {isLoading
              ? <Skeleton variant="rounded" height={110} />
              : <StatCard {...s} />}
          </Grid>
        ))}
      </Grid>

      {/* Performance chart + Sector allocation */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <PortfolioPerformanceChart />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectorAllocationChart />
        </Grid>
      </Grid>

      {/* Market overview + AI signals */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <MarketOverview />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AISignalsList />
        </Grid>
      </Grid>
    </>
  );
}
