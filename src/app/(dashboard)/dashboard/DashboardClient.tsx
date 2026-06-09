"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { AISignalsList } from "@/components/features/dashboard/AISignalsList";
import { MarketOverview } from "@/components/features/dashboard/MarketOverview";
import { StatCard } from "@/components/common/StatCard";
import { useAngelOneSession } from "@/hooks/useAngelOneAuth";

const STATS = [
  {
    title: "Portfolio Value",
    value: 1_24_850.42,
    change: 3.24,
    changeLabel: "today",
    prefix: "₹",
    icon: <AccountBalanceWalletOutlinedIcon />,
    iconColor: "#6366F1",
  },
  {
    title: "Day P&L",
    value: 3_912.18,
    change: 3.24,
    changeLabel: "vs yesterday",
    prefix: "+₹",
    icon: <TrendingUpIcon />,
    iconColor: "#00D97E",
  },
  {
    title: "Open Positions",
    value: 12,
    icon: <ShowChartIcon />,
    iconColor: "#F59E0B",
  },
  {
    title: "Total Return",
    value: "24.85",
    change: 24.85,
    suffix: "%",
    icon: <AutoGraphIcon />,
    iconColor: "#38BDF8",
  },
];

export default function DashboardClient() {
  const { user, clientCode } = useAngelOneSession();
  const name = user?.name ?? clientCode ?? "Trader";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      {/* Hero greeting */}
      <Box sx={{ mb: 3.5 }}>
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
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STATS.map((s) => (
          <Grid key={s.title} size={{ xs: 12, sm: 6, xl: 3 }}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Main content */}
      <Grid container spacing={2}>
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
