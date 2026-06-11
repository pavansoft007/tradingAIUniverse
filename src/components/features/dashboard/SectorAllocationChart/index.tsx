"use client";

import Box          from "@mui/material/Box";
import Card         from "@mui/material/Card";
import CardContent  from "@mui/material/CardContent";
import Skeleton     from "@mui/material/Skeleton";
import Typography   from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import { useMemo }  from "react";
import Chart, { useChart } from "@/components/common/Chart";
import { useHoldings } from "@/hooks/usePortfolio";

// ── NSE symbol → sector map (extend as needed) ────────────────────────────────

const SECTOR_MAP: Record<string, string> = {
  // Financial
  HDFCBANK: "Financial",  ICICIBANK: "Financial",  SBIN: "Financial",
  KOTAKBANK: "Financial", AXISBANK: "Financial",   YESBANK: "Financial",
  PNB: "Financial",       BANKBARODA: "Financial", INDUSINDBK: "Financial",
  BAJFINANCE: "Financial",TATACAP: "Financial",    CHOLAFIN: "Financial",
  HDFCLIFE: "Financial",  SBILIFE: "Financial",    ICICIGI: "Financial",
  MUTHOOTFIN: "Financial",MANAPPURAM: "Financial",
  // Technology
  TCS: "Technology",      INFY: "Technology",      WIPRO: "Technology",
  HCLTECH: "Technology",  TECHM: "Technology",     MPHASIS: "Technology",
  LTIM: "Technology",     PERSISTENT: "Technology",COFORGE: "Technology",
  // Energy
  RELIANCE: "Energy",     ONGC: "Energy",          BPCL: "Energy",
  IOC: "Energy",          NTPC: "Energy",          POWERGRID: "Energy",
  GAIL: "Energy",         COALINDIA: "Energy",     TATAPOWER: "Energy",
  ADANIPORTS: "Energy",   ADANIGREEN: "Energy",
  // FMCG / Consumer
  HINDUNILVR: "FMCG",     ITC: "FMCG",             NESTLEIND: "FMCG",
  BRITANNIA: "FMCG",      MARICO: "FMCG",          DABUR: "FMCG",
  COLPAL: "FMCG",         GODREJCP: "FMCG",        EMAMILTD: "FMCG",
  TATACONSUM: "FMCG",
  // Auto
  MARUTI: "Auto",         TATAMOTORS: "Auto",      BAJAJ_AUTO: "Auto",
  HEROMOTOCO: "Auto",     EICHERMOT: "Auto",        TVSMOTORS: "Auto",
  MOTHERSON: "Auto",      BOSCHLTD: "Auto",
  // Pharma
  SUNPHARMA: "Pharma",    DRREDDY: "Pharma",       CIPLA: "Pharma",
  DIVISLAB: "Pharma",     BIOCON: "Pharma",         AUROPHARMA: "Pharma",
  LUPIN: "Pharma",        TORNTPHARM: "Pharma",
  // Metals
  TATASTEEL: "Metals",    JSWSTEEL: "Metals",      HINDALCO: "Metals",
  SAIL: "Metals",         VEDL: "Metals",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SectorAllocationChart() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { data: holdingsData, isLoading } = useHoldings();

  // Compute sector weights from real holdings
  const sectors = useMemo(() => {
    const holdings = (holdingsData?.holdings ?? []).filter((h) => h.quantity > 0);
    if (!holdings.length) return [];

    const valueMap = new Map<string, number>();
    let total = 0;

    holdings.forEach((h) => {
      const symbol  = h.tradingsymbol.replace(/-EQ$|-BE$|-N$|-Z$/, "");
      const sector  = SECTOR_MAP[symbol] ?? "Others";
      const value   = (h.close || h.averageprice) * h.quantity;
      valueMap.set(sector, (valueMap.get(sector) ?? 0) + value);
      total += value;
    });

    return [...valueMap.entries()]
      .map(([name, value]) => ({
        name,
        value: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdingsData]);

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
    "#10B981",
    "#8B5CF6",
    isDark ? "#475569" : "#94A3B8",
  ].slice(0, sectors.length);

  const chartOptions = useChart({
    chart: { type: "donut" },
    colors,
    labels: sectors.map((s) => s.name),
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
              formatter: () => `${sectors.length}`,
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    dataLabels: { enabled: false },
  });

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: "20px !important" }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary", mb: 2 }}>
          Sector Allocation
        </Typography>

        {isLoading ? (
          <>
            <Skeleton variant="circular" width={180} height={180} sx={{ mx: "auto", mb: 2 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="20%" height={14} />
              </Box>
            ))}
          </>
        ) : sectors.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No holdings data
            </Typography>
          </Box>
        ) : (
          <>
            <Chart
              type="donut"
              series={sectors.map((s) => s.value)}
              options={chartOptions}
              height={220}
            />

            {/* Legend */}
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
              {sectors.map((sector, i) => (
                <Box key={sector.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: colors[i] ?? "#94A3B8", flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{sector.name}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 60, height: 4, borderRadius: 2, background: alpha(colors[i] ?? "#94A3B8", 0.15), overflow: "hidden" }}>
                      <Box sx={{ width: `${Math.min(sector.value, 100)}%`, height: "100%", background: colors[i] ?? "#94A3B8", borderRadius: 2 }} />
                    </Box>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.primary", minWidth: 36, textAlign: "right" }}>
                      {sector.value}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
