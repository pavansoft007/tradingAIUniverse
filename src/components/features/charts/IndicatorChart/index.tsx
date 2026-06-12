"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha, useTheme } from "@mui/material/styles";
import type { ApexOptions, ApexAxisChartSeries } from "apexcharts";
import Chart, { useChart } from "@/components/common/Chart";
import {
  toApexCandlestick,
  toApexOverlaySeries,
  toApexMACD,
  toApexLine,
} from "@/lib/indicators/apex";
import type { IndicatorResults } from "@/types/indicators.types";
import type { OHLCV } from "@/types/market.types";
import type { CandleBar } from "@/lib/api/angelone/market.api";

// ── Props ──────────────────────────────────────────────────────────────────────

export interface IndicatorChartProps {
  /** Display name shown in the top-left label */
  title?:      string;
  /** Historical OHLCV or CandleBar data */
  candles:     OHLCV[] | CandleBar[];
  /** Computed indicator results from useIndicators / useSymbolIndicators */
  indicators:  IndicatorResults;
  /** Height of the main candlestick panel (px) */
  mainHeight?: number;
  /** Height of the RSI sub-panel (px). Set 0 to hide. */
  rsiHeight?:  number;
  /** Height of the MACD sub-panel (px). Set 0 to hide. */
  macdHeight?: number;
  isLoading?:  boolean;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function IndicatorChart({
  title      = "Price",
  candles,
  indicators,
  mainHeight = 380,
  rsiHeight  = 140,
  macdHeight = 160,
  isLoading  = false,
}: IndicatorChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const showRSI  = rsiHeight  > 0 && !!indicators.rsi?.length;
  const showMACD = macdHeight > 0 && !!indicators.macd?.length;

  // ── Shared x-axis options (same group → synchronized zoom) ────────────────
  const sharedX: ApexOptions["xaxis"] = useMemo(() => ({
    type:  "datetime",
    axisBorder: { show: false },
    axisTicks:  { show: false },
    labels: {
      datetimeUTC: false,
      style: {
        fontSize: "10px",
        colors:   theme.palette.text.secondary,
      },
    },
    crosshairs: {
      show:   true,
      stroke: { color: alpha(theme.palette.primary.main, 0.4), dashArray: 4 },
    },
  }), [theme]);

  // ── Main panel ─────────────────────────────────────────────────────────────
  const mainSeries = useMemo<ApexOptions["series"]>(() => {
    const candleSeries = (toApexCandlestick(candles as OHLCV[]) ?? []) as ApexAxisChartSeries;
    const overlays     = toApexOverlaySeries({
      sma:       indicators.sma,
      ema:       indicators.ema,
      vwap:      indicators.vwap,
      bollinger: indicators.bollinger,
    });
    return [...candleSeries, ...overlays];
  }, [candles, indicators]);

  const mainOptions = useChart(useMemo<ApexOptions>(() => ({
    chart: {
      id:    "main",
      group: "indicator-chart",
      type:  "candlestick",
    },
    xaxis: { ...sharedX, labels: { ...sharedX.labels, show: false } }, // hide x labels on main
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        formatter: (v) => v.toFixed(2),
        style: { fontSize: "10px", colors: theme.palette.text.secondary },
      },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward:   theme.palette.success.main,
          downward: theme.palette.error.main,
        },
        wick: { useFillColor: true },
      },
    },
    stroke: {
      width: [1, 1.5, 1.5, 1.5, 1, 1, 1], // candle + overlays
      curve: "smooth",
    },
    tooltip: {
      shared:    true,
      intersect: false,
      x:         { format: "dd MMM HH:mm" },
    },
    legend: { show: true, position: "top" },
  }), [sharedX, theme]));

  // ── RSI panel ──────────────────────────────────────────────────────────────
  const rsiSeries = useMemo<ApexOptions["series"]>(() => {
    if (!indicators.rsi) return [];
    return [toApexLine(indicators.rsi, "RSI")];
  }, [indicators.rsi]);

  const rsiOptions = useChart(useMemo<ApexOptions>(() => ({
    chart: {
      id:    "rsi",
      group: "indicator-chart",
      type:  "line",
    },
    xaxis: { ...sharedX, labels: { ...sharedX.labels, show: false } },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 2,
      labels: {
        formatter: (v) => v.toFixed(0),
        style: { fontSize: "10px", colors: theme.palette.text.secondary },
      },
    },
    annotations: {
      yaxis: [
        { y: 70, borderColor: theme.palette.error.light,   label: { text: "70", style: { background: "transparent", color: theme.palette.error.light, fontSize: "10px" } } },
        { y: 30, borderColor: theme.palette.success.light, label: { text: "30", style: { background: "transparent", color: theme.palette.success.light, fontSize: "10px" } } },
      ],
    },
    stroke:  { width: [1.5], curve: "smooth" },
    colors:  [theme.palette.warning.main],
    legend:  { show: false },
    tooltip: { x: { format: "dd MMM HH:mm" } },
  }), [sharedX, theme]));

  // ── MACD panel ─────────────────────────────────────────────────────────────
  const macdBundle = useMemo(() => {
    if (!indicators.macd) return null;
    return toApexMACD(indicators.macd);
  }, [indicators.macd]);

  const macdSeries = useMemo<ApexOptions["series"]>(() => {
    if (!macdBundle) return [];
    return [macdBundle.macd, macdBundle.signal, macdBundle.histogram];
  }, [macdBundle]);

  const macdOptions = useChart(useMemo<ApexOptions>(() => ({
    chart: {
      id:    "macd",
      group: "indicator-chart",
      type:  "bar",
    },
    xaxis: { ...sharedX },
    yaxis: {
      labels: {
        formatter: (v) => v.toFixed(2),
        style: { fontSize: "10px", colors: theme.palette.text.secondary },
      },
    },
    stroke: { width: [1.5, 1.5, 0], curve: "smooth" },
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      isDark ? alpha(theme.palette.primary.main, 0.4) : alpha(theme.palette.primary.main, 0.3),
    ],
    plotOptions: {
      bar: {
        columnWidth: "60%",
        colors: {
          ranges: [
            { from: -Infinity, to: 0,        color: alpha(theme.palette.error.main,   0.7) },
            { from: 0,         to: Infinity,  color: alpha(theme.palette.success.main, 0.7) },
          ],
        },
      },
    },
    legend:  { show: false },
    tooltip: { x: { format: "dd MMM HH:mm" }, shared: true, intersect: false },
  }), [sharedX, theme, isDark]));

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: mainHeight }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!candles.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: mainHeight, color: "text.secondary" }}>
        <Typography variant="body2">No data available</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={0}>
      {/* Title */}
      {title && (
        <Typography variant="subtitle2" sx={{ px: 1, pb: 0.5, color: "text.secondary" }}>
          {title}
        </Typography>
      )}

      {/* Main candlestick + overlays */}
      <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}` }}>
        <Chart
          type="candlestick"
          series={mainSeries}
          options={mainOptions}
          height={mainHeight}
        />
      </Box>

      {/* RSI panel */}
      {showRSI && (
        <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}` }}>
          <Box sx={{ px: 1, pt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              RSI (14)
            </Typography>
          </Box>
          <Chart
            type="line"
            series={rsiSeries}
            options={rsiOptions}
            height={rsiHeight}
          />
        </Box>
      )}

      {/* MACD panel */}
      {showMACD && macdBundle && (
        <Box>
          <Box sx={{ px: 1, pt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              MACD (12, 26, 9)
            </Typography>
          </Box>
          <Chart
            type="bar"
            series={macdSeries}
            options={macdOptions}
            height={macdHeight}
          />
        </Box>
      )}
    </Stack>
  );
}
