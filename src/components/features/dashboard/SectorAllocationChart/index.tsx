"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import Chart, { useChart } from "@/components/common/Chart";

// ── Data ──────────────────────────────────────────────────────────────────────

const SECTORS = [
  { name: "Technology", value: 34.2 },
  { name: "Financial", value: 22.8 },
  { name: "Energy",    value: 15.4 },
  { name: "FMCG",     value: 12.6 },
  { name: "Auto",      value: 8.5 },
  { name: "Others",    value: 6.5 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SectorAllocationChart() {
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
    labels: SECTORS.map((s) => s.name),
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "74%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Sectors",
              fontSize: "13px",
              fontWeight: 600,
              color: theme.palette.text.secondary,
              formatter: () => `${SECTORS.length}`,
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
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary", mb: 2 }}>
          Sector Allocation
        </Typography>

        <Chart
          type="donut"
          series={SECTORS.map((s) => s.value)}
          options={chartOptions}
          height={220}
        />

        {/* Legend */}
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          {SECTORS.map((sector, i) => (
            <Box key={sector.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: colors[i], flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{sector.name}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 4,
                    borderRadius: 2,
                    background: alpha(colors[i], 0.15),
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ width: `${sector.value}%`, height: "100%", background: colors[i], borderRadius: 2 }} />
                </Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.primary", minWidth: 36, textAlign: "right" }}>
                  {sector.value}%
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
