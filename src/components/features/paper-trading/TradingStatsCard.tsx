"use client";

import BarChartIcon      from "@mui/icons-material/BarChart";
import Box               from "@mui/material/Box";
import Card              from "@mui/material/Card";
import CardContent       from "@mui/material/CardContent";
import CircularProgress  from "@mui/material/CircularProgress";
import Divider           from "@mui/material/Divider";
import Tooltip           from "@mui/material/Tooltip";
import Typography        from "@mui/material/Typography";
import { usePaperStats } from "@/hooks/usePaperTrading";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function StatBox({ label, value, color, hint }: {
  label: string; value: string; color?: string; hint?: string;
}) {
  const content = (
    <Box sx={{ textAlign: "center", p: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} color={color ?? "text.primary"} sx={{ lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  );
  return hint ? <Tooltip title={hint} placement="top">{content}</Tooltip> : content;
}

export function TradingStatsCard() {
  const { data: stats, isLoading } = usePaperStats();

  if (isLoading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const pnlColor = stats.totalPnl >= 0 ? "success.main" : "error.main";
  const profitFactorColor = stats.profitFactor >= 1.5 ? "success.main" : stats.profitFactor >= 1 ? "warning.main" : "error.main";

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <BarChartIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" fontWeight={700}>Performance Stats</Typography>
        </Box>

        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          "& > *": { borderRight: 1, borderColor: "divider" },
          "& > *:last-child": { border: 0 },
        }}>
          <StatBox label="Win Rate" value={`${stats.winRate.toFixed(1)}%`}
            color={stats.winRate >= 50 ? "success.main" : "warning.main"}
            hint={`${stats.openPositions} open positions · ${stats.totalTrades} total trades`} />
          <StatBox label="Profit Factor" value={stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2)}
            color={profitFactorColor} hint="Avg Win / Avg Loss — above 1.5 is good" />
          <StatBox label="Avg Win" value={fmt(stats.avgWin)} color="success.main" />
          <StatBox label="Avg Loss" value={fmt(Math.abs(stats.avgLoss))} color="error.main" />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          "& > *": { borderRight: 1, borderColor: "divider" },
          "& > *:last-child": { border: 0 },
        }}>
          <StatBox label="Total P&L" value={`${stats.totalPnl >= 0 ? "+" : ""}${fmt(stats.totalPnl)}`}
            color={pnlColor} hint={`${stats.totalPnlPct >= 0 ? "+" : ""}${stats.totalPnlPct.toFixed(2)}% return`} />
          <StatBox label="Realized P&L" value={fmt(stats.realizedPnl)}
            color={stats.realizedPnl >= 0 ? "success.main" : "error.main"} />
          <StatBox label="Best Trade" value={fmt(stats.bestTrade)} color="success.main" />
          <StatBox label="Worst Trade" value={fmt(stats.worstTrade)} color="error.main" />
        </Box>
      </CardContent>
    </Card>
  );
}
