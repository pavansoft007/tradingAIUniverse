"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import Chart, { useChart } from "@/components/common/Chart";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PNL_DATA = [4200, -1800, 7500, 3200, -2100, 8900, 5400, -3200, 9100, 6700, 4500, 11200];

// ── Component ─────────────────────────────────────────────────────────────────

export function MonthlyPnLChart() {
  const theme = useTheme();

  const chartOptions = useChart({
    chart: { type: "bar", id: "monthly-pnl" },
    colors: [theme.palette.success.main],
    fill: {
      type: "solid",
      opacity: 0.9,
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: "58%",
        distributed: true,
        colors: {
          ranges: [
            { from: -999999, to: 0, color: alpha(theme.palette.error.main, 0.85) },
            { from: 0.01, to: 999999, color: alpha(theme.palette.success.main, 0.85) },
          ],
        },
      },
    },
    legend: { show: false },
    xaxis: {
      categories: MONTHS,
    },
    yaxis: {
      labels: {
        formatter: (v: number) => (v >= 0 ? `+₹${(v / 1000).toFixed(0)}K` : `-₹${Math.abs(v / 1000).toFixed(0)}K`),
      },
    },
    tooltip: {
      y: {
        formatter: (v: number) =>
          (v >= 0 ? "+" : "") + `₹${v.toLocaleString("en-IN")}`,
      },
    },
    grid: { padding: { top: 0, right: 0, bottom: 0, left: 8 } },
  });

  const totalPnL = PNL_DATA.reduce((a, b) => a + b, 0);
  const isUp = totalPnL >= 0;
  const color = isUp ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Card>
      <CardContent sx={{ p: "20px !important" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary" }}>
              Monthly P&L
            </Typography>
            <Typography
              sx={{ mt: 0.5, fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color, fontFeatureSettings: '"tnum"' }}
            >
              {isUp ? "+" : ""}₹{Math.abs(totalPnL).toLocaleString("en-IN")}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>Year-to-date total</Typography>
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", mb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: theme.palette.success.main }} />
                <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Profit months</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: theme.palette.error.main }} />
                <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Loss months</Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {PNL_DATA.filter((v) => v >= 0).length}/{MONTHS.length} profitable
            </Typography>
          </Box>
        </Box>

        <Chart type="bar" series={[{ name: "P&L", data: PNL_DATA }]} options={chartOptions} height={240} />
      </CardContent>
    </Card>
  );
}
