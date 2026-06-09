"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useTheme, alpha } from "@mui/material/styles";
import { useState } from "react";
import Chart, { useChart } from "@/components/common/Chart";

// ── Mock data ─────────────────────────────────────────────────────────────────

const RANGES = ["1W", "1M", "3M", "6M", "1Y", "ALL"] as const;
type Range = (typeof RANGES)[number];

function generateSeries(range: Range) {
  const now = Date.now();
  const msPerDay = 86_400_000;
  const points: { x: number; y: number }[] = [];
  const days =
    range === "1W" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : range === "6M" ? 180 : range === "1Y" ? 365 : 730;

  let value = 100_000;
  for (let i = days; i >= 0; i--) {
    const day = now - i * msPerDay;
    value = value * (1 + (Math.random() - 0.46) * 0.015);
    points.push({ x: day, y: Math.round(value) });
  }
  return points;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PortfolioPerformanceChart() {
  const theme = useTheme();
  const [range, setRange] = useState<Range>("3M");

  const series = generateSeries(range);
  const first = series[0]?.y ?? 0;
  const last = series[series.length - 1]?.y ?? 0;
  const change = first > 0 ? ((last - first) / first) * 100 : 0;
  const isUp = change >= 0;

  const color = isUp ? theme.palette.success.main : theme.palette.error.main;

  const chartOptions = useChart({
    chart: { id: "portfolio-perf", type: "area" },
    colors: [color],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: alpha(color, 0.5), opacity: 0.5 },
          { offset: 100, color: alpha(color, 0), opacity: 0 },
        ],
      },
    },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false, format: range === "1W" ? "dd MMM" : "MMM dd" },
    },
    yaxis: {
      labels: {
        formatter: (v: number) =>
          `₹${(v / 1000).toFixed(0)}K`,
      },
    },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      y: { formatter: (v: number) => `₹${v.toLocaleString("en-IN")}` },
    },
    grid: { padding: { top: 8, right: 8, bottom: 0, left: 8 } },
    stroke: { width: 2, curve: "smooth" },
  });

  return (
    <Card>
      <CardContent sx={{ p: "20px !important" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary" }}>
              Portfolio Performance
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, fontFeatureSettings: '"tnum"' }}>
              ₹{last.toLocaleString("en-IN")}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75 }}>
              <Chip
                size="small"
                label={`${isUp ? "+" : ""}${change.toFixed(2)}%`}
                sx={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: alpha(color, 0.15),
                  color: color,
                  border: `1px solid ${alpha(color, 0.3)}`,
                }}
              />
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>vs {range} ago</Typography>
            </Box>
          </Box>

          {/* Range selector */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {RANGES.map((r) => (
              <Box
                key={r}
                onClick={() => setRange(r)}
                sx={{
                  px: 1,
                  py: 0.4,
                  borderRadius: "6px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  ...(range === r
                    ? {
                        background: alpha(theme.palette.primary.main, 0.15),
                        color: theme.palette.primary.light,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      }
                    : {
                        color: "text.secondary",
                        border: "1px solid transparent",
                        "&:hover": { background: alpha(theme.palette.action.hover, 1) },
                      }),
                }}
              >
                {r}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Chart */}
        <Chart type="area" series={[{ name: "Portfolio Value", data: series }]} options={chartOptions} height={200} />
      </CardContent>
    </Card>
  );
}
