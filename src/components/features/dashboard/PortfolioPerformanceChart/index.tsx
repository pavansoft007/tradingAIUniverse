"use client";

import Box       from "@mui/material/Box";
import Card      from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip      from "@mui/material/Chip";
import Skeleton  from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import { useState } from "react";
import Chart, { useChart } from "@/components/common/Chart";
import type { ChartRange } from "@/hooks/usePortfolioChart";
import { usePortfolioChart } from "@/hooks/usePortfolioChart";

const RANGES: ChartRange[] = ["1W", "1M", "3M", "6M", "1Y"];

export function PortfolioPerformanceChart() {
  const theme = useTheme();
  const [range, setRange] = useState<ChartRange>("3M");

  const { series, isLoading, currentValue, changePct } = usePortfolioChart(range);

  const isUp  = changePct >= 0;
  const color = isUp ? theme.palette.success.main : theme.palette.error.main;

  const chartOptions = useChart({
    chart: { id: "portfolio-perf", type: "area", animations: { enabled: false } },
    colors: [color],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0.45,
        opacityTo: 0,
        stops: [0, 100],
        colorStops: [
          { offset: 0,   color: alpha(color, 0.45), opacity: 0.45 },
          { offset: 100, color: alpha(color, 0),    opacity: 0 },
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
          v >= 1_00_000
            ? `₹${(v / 1_00_000).toFixed(1)}L`
            : `₹${(v / 1000).toFixed(0)}K`,
      },
    },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      y: { formatter: (v: number) => `₹${v.toLocaleString("en-IN")}` },
    },
    grid: { padding: { top: 8, right: 8, bottom: 0, left: 8 } },
    stroke: { width: 2, curve: "smooth" },
    noData: { text: "Loading portfolio history…" },
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

            {isLoading ? (
              <>
                <Skeleton width={160} height={36} sx={{ mt: 0.5 }} />
                <Skeleton width={100} height={20} sx={{ mt: 0.5 }} />
              </>
            ) : (
              <>
                <Typography sx={{ mt: 0.5, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, fontFeatureSettings: '"tnum"' }}>
                  ₹{currentValue.toLocaleString("en-IN")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75 }}>
                  <Chip
                    size="small"
                    label={`${isUp ? "+" : ""}${changePct.toFixed(2)}%`}
                    sx={{
                      height: 20, fontSize: 11, fontWeight: 700,
                      background: alpha(color, 0.15),
                      color,
                      border: `1px solid ${alpha(color, 0.3)}`,
                    }}
                  />
                  <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                    vs {range} ago
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          {/* Range selector */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {RANGES.map((r) => (
              <Box
                key={r}
                onClick={() => setRange(r)}
                sx={{
                  px: 1, py: 0.4,
                  borderRadius: "6px",
                  fontSize: 11, fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  ...(range === r
                    ? {
                        background: alpha(theme.palette.primary.main, 0.15),
                        color:      theme.palette.primary.light,
                        border:     `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      }
                    : {
                        color:  "text.secondary",
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
        {isLoading ? (
          <Skeleton variant="rounded" height={200} />
        ) : (
          <Chart
            type="area"
            series={[{ name: "Portfolio Value", data: series }]}
            options={chartOptions}
            height={200}
          />
        )}
      </CardContent>
    </Card>
  );
}
