"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import Chart, { useChart } from "@/components/common/Chart";

// ── Mock data ─────────────────────────────────────────────────────────────────

function buildSeries() {
  const points = 52; // weekly data points
  const now = Date.now();
  const msPerWeek = 7 * 86_400_000;
  let portfolio = 100;
  let nifty = 100;

  return Array.from({ length: points }, (_, i) => {
    const ts = now - (points - i) * msPerWeek;
    portfolio *= 1 + (Math.random() - 0.44) * 0.025;
    nifty    *= 1 + (Math.random() - 0.47) * 0.018;
    return {
      ts,
      portfolio: parseFloat(portfolio.toFixed(2)),
      nifty:     parseFloat(nifty.toFixed(2)),
    };
  });
}

const DATA = buildSeries();

// ── Component ─────────────────────────────────────────────────────────────────

export function PerformanceChart() {
  const theme = useTheme();

  const portfolioReturn = ((DATA[DATA.length - 1].portfolio - 100) / 100) * 100;
  const niftyReturn     = ((DATA[DATA.length - 1].nifty     - 100) / 100) * 100;
  const alpha_ = portfolioReturn - niftyReturn;

  const chartOptions = useChart({
    chart: { type: "area", id: "performance" },
    colors: [theme.palette.primary.main, alpha(theme.palette.text.secondary, 0.6)],
    fill: {
      type: ["gradient", "solid"],
      opacity: [1, 0],
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0.35,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    stroke: { width: [2.5, 1.5], dashArray: [0, 5], curve: "smooth" },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false, format: "MMM yy" },
    },
    yaxis: {
      labels: {
        formatter: (v: number) => `${v >= 100 ? "+" : ""}${(v - 100).toFixed(1)}%`,
      },
    },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      y: { formatter: (v: number) => `${v >= 100 ? "+" : ""}${(v - 100).toFixed(2)}%` },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      labels: { colors: theme.palette.text.secondary },
    },
  });

  const series = [
    { name: "Portfolio", data: DATA.map((d) => ({ x: d.ts, y: d.portfolio })) },
    { name: "Nifty 50",  data: DATA.map((d) => ({ x: d.ts, y: d.nifty })) },
  ];

  return (
    <Card>
      <CardContent sx={{ p: "20px !important" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary" }}>
              Performance vs Benchmark
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>
              1-Year indexed return (base 100)
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, textAlign: "right" }}>
            <Box>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Portfolio</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: portfolioReturn >= 0 ? "success.main" : "error.main" }}>
                {portfolioReturn >= 0 ? "+" : ""}{portfolioReturn.toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Nifty 50</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: niftyReturn >= 0 ? "success.main" : "error.main" }}>
                {niftyReturn >= 0 ? "+" : ""}{niftyReturn.toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Alpha</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: alpha_ >= 0 ? "success.main" : "error.main" }}>
                {alpha_ >= 0 ? "+" : ""}{alpha_.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Chart type="area" series={series} options={chartOptions} height={260} />
      </CardContent>
    </Card>
  );
}
