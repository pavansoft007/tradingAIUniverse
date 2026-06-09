"use client";

import Card        from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box         from "@mui/material/Box";
import Skeleton    from "@mui/material/Skeleton";
import Typography  from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import Chart, { useChart } from "@/components/common/Chart";
import { useHoldings } from "@/hooks/usePortfolio";
import { useMemo } from "react";

const MAX_SLICES = 5;

export function PortfolioAllocationChart() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { data: holdingsData, isLoading } = useHoldings();

  // Build chart data from real holdings (top 5 + "Others")
  const { labels, series, rows, total } = useMemo(() => {
    const holdings = (holdingsData?.holdings ?? [])
      .filter((h) => h.quantity > 0)
      .sort((a, b) => (b.close * b.quantity) - (a.close * a.quantity));

    const totalValue = holdingsData?.totalholding?.totalholdingvalue
      || holdings.reduce((s, h) => s + h.close * h.quantity, 0)
      || 1;

    const top    = holdings.slice(0, MAX_SLICES);
    const rest   = holdings.slice(MAX_SLICES);
    const others = rest.reduce((s, h) => s + h.close * h.quantity, 0);

    const rows = [
      ...top.map((h) => ({
        symbol: h.tradingsymbol.replace(/-EQ$|-BE$|-N$|-Z$/, ""),
        value:  Math.round(h.close * h.quantity),
        pct:    Math.round((h.close * h.quantity / totalValue) * 1000) / 10,
      })),
      ...(others > 0 ? [{ symbol: "Others", value: Math.round(others), pct: Math.round((others / totalValue) * 1000) / 10 }] : []),
    ];

    return {
      labels: rows.map((r) => r.symbol),
      series: rows.map((r) => r.pct),
      rows,
      total:  totalValue,
    };
  }, [holdingsData]);

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
    isDark ? "#475569" : "#94A3B8",
  ];

  const chartOptions = useChart({
    chart:  { type: "donut" },
    colors,
    labels,
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show:       true,
              label:      "Total",
              fontSize:   "12px",
              fontWeight: 600,
              color:      theme.palette.text.secondary,
              formatter:  () => total >= 100_000
                ? `₹${(total / 100_000).toFixed(1)}L`
                : `₹${Math.round(total / 1000)}K`,
            },
          },
        },
      },
    },
    tooltip:     { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    dataLabels:  { enabled: false },
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

        {isLoading ? (
          <Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto", mb: 2 }} />
        ) : series.length > 0 ? (
          <Chart type="donut" series={series} options={chartOptions} height={200} />
        ) : (
          <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">No holdings data</Typography>
          </Box>
        )}

        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={20} />)
            : rows.map((h, i) => (
              <Box key={h.symbol} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: colors[i % colors.length], flexShrink: 0, boxShadow: `0 0 6px ${alpha(colors[i % colors.length], 0.6)}` }} />
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{h.symbol}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    ₹{h.value.toLocaleString("en-IN")}
                  </Typography>
                  <Box sx={{ minWidth: 38, textAlign: "right", px: 0.75, py: 0.2, borderRadius: "5px", background: alpha(colors[i % colors.length], 0.12), border: `1px solid ${alpha(colors[i % colors.length], 0.25)}` }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors[i % colors.length] }}>{h.pct}%</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
        </Box>
      </CardContent>
    </Card>
  );
}
