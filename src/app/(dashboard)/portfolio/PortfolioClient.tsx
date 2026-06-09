"use client";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { LivePositionsTable } from "@/components/features/portfolio/LivePositionsTable";
import { PortfolioAllocationChart } from "@/components/features/portfolio/PortfolioAllocationChart";

const PORTFOLIO_STATS = [
  {
    title: "Total Value",
    value: 1_51_200,
    prefix: "₹",
    icon: <AccountBalanceWalletOutlinedIcon />,
    iconColor: "#6366F1",
  },
  {
    title: "Total P&L",
    value: 17_250,
    prefix: "+₹",
    change: 12.89,
    changeLabel: "unrealized",
    icon: <TrendingUpIcon />,
    iconColor: "#00D97E",
  },
  {
    title: "Day P&L",
    value: 3_912,
    prefix: "+₹",
    change: 2.66,
    changeLabel: "today",
    icon: <AutoGraphIcon />,
    iconColor: "#38BDF8",
  },
  {
    title: "Invested",
    value: 1_33_950,
    prefix: "₹",
    icon: <AccountBalanceWalletOutlinedIcon />,
    iconColor: "#F59E0B",
  },
];

export default function PortfolioClient() {
  return (
    <>
      <PageHeader
        title="Portfolio"
        subtitle="Manage and monitor your positions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Portfolio" }]}
      />

      {/* KPI strip */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {PORTFOLIO_STATS.map((s) => (
          <Grid key={s.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Positions table + Allocation chart */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ overflow: "hidden" }}>
            {/* Header */}
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Open Positions</Typography>
                <Typography variant="caption" color="text.secondary">
                  Live P&amp;L via Angel One SmartAPI
                </Typography>
              </Box>
              <Chip
                label="Live"
                size="small"
                icon={
                  <Box
                    component="span"
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#00D97E",
                      display: "inline-block",
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%,100%": { opacity: 1 },
                        "50%": { opacity: 0.3 },
                      },
                      ml: "6px !important",
                      mr: "-2px !important",
                    }}
                  />
                }
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 700,
                  background: "rgba(0,217,126,0.12)",
                  color: "#00D97E",
                  border: "1px solid rgba(0,217,126,0.25)",
                }}
              />
            </Box>

            {/* Live positions table */}
            <LivePositionsTable />
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <PortfolioAllocationChart />
        </Grid>
      </Grid>
    </>
  );
}
