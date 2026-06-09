"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import Chart, { useChart } from "@/components/common/Chart";

// ── Data ──────────────────────────────────────────────────────────────────────

const HOLDINGS = [
  { symbol: "RELIANCE",  value: 42800,  pct: 28.4 },
  { symbol: "TCS",       value: 36200,  pct: 24.0 },
  { symbol: "HDFCBANK",  value: 24750,  pct: 16.4 },
  { symbol: "INFY",      value: 18300,  pct: 12.1 },
  { symbol: "WIPRO",     value: 12400,  pct: 8.2 },
  { symbol: "Others",    value: 16500,  pct: 10.9 },
];

const TOTAL = HOLDINGS.reduce((s, h) => s + h.value, 0);

// ── Component ─────────────────────────────────────────────────────────────────

export function PortfolioAllocationChart() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
    isDark ? "#475569" : "#94A3B8",
  ];

  const chartOptions = useChart({
    chart: { type: "donut" },
    colors,
    labels: HOLDINGS.map((h) => h.symbol),
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "12px",
              fontWeight: 600,
              color: theme.palette.text.secondary,
              formatter: () => `₹${(TOTAL / 100000).toFixed(1)}L`,
            },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (v: number) => `${v.toFixed(1)}%` },
    },
    dataLabels: { enabled: false },
  });

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: "20px !important" }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}>
          Portfolio Allocation
        </Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
          Top holdings by market value
        </Typography>

        <Chart type="donut" series={HOLDINGS.map((h) => h.pct)} options={chartOptions} height={200} />

        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
          {HOLDINGS.map((h, i) => (
            <Box key={h.symbol} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: colors[i],
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${alpha(colors[i], 0.6)}`,
                  }}
                />
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.primary" }}>{h.symbol}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  ₹{h.value.toLocaleString("en-IN")}
                </Typography>
                <Box
                  sx={{
                    minWidth: 38,
                    textAlign: "right",
                    px: 0.75,
                    py: 0.2,
                    borderRadius: "5px",
                    background: alpha(colors[i], 0.12),
                    border: `1px solid ${alpha(colors[i], 0.25)}`,
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors[i] }}>{h.pct}%</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
