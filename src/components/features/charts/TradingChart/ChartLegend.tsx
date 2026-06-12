"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { LegendData } from "./types";
import { CHART_COLORS } from "./types";

interface ChartLegendProps {
  data:      LegendData | null;
  showSMA:   boolean;
  showEMA:   boolean;
  showVWAP:  boolean;
  showBB:    boolean;
  showRSI:   boolean;
  showMACD:  boolean;
}

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "—";
  return v.toFixed(decimals);
}

function fmtTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface LabeledValueProps {
  label: string;
  value: string;
  color?: string;
}

function LV({ label, value, color }: LabeledValueProps) {
  return (
    <Box sx={{ display: "flex", gap: "3px", alignItems: "baseline" }}>
      <Typography variant="caption" sx={{ fontSize: "10px", color: "text.disabled", lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.2, color: color ?? "text.primary", fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function ChartLegend({ data, showSMA, showEMA, showVWAP, showBB, showRSI, showMACD }: ChartLegendProps) {
  if (!data) return null;

  const isUp      = data.change >= 0;
  const changeClr = isUp ? CHART_COLORS.upCandle : CHART_COLORS.downCandle;

  return (
    <Box
      sx={{
        position:    "absolute",
        top:         8,
        left:        8,
        zIndex:      10,
        pointerEvents: "none",
        display:     "flex",
        flexDirection: "column",
        gap:         0.25,
      }}
    >
      {/* Timestamp */}
      <Typography variant="caption" sx={{ fontSize: "10px", color: "text.disabled", lineHeight: 1.3, mb: 0.25 }}>
        {fmtTime(data.timestamp)}
      </Typography>

      {/* OHLCV row */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <LV label="O" value={fmt(data.open)} />
        <LV label="H" value={fmt(data.high)} />
        <LV label="L" value={fmt(data.low)} />
        <LV label="C" value={fmt(data.close)} color={changeClr} />
        <LV
          label=""
          value={`${isUp ? "+" : ""}${fmt(data.change)} (${isUp ? "+" : ""}${fmt(data.changePct, 2)}%)`}
          color={changeClr}
        />
        <LV label="Vol" value={data.volume > 1_000_000 ? `${(data.volume / 1_000_000).toFixed(2)}M` : data.volume > 1_000 ? `${(data.volume / 1000).toFixed(1)}K` : fmt(data.volume, 0)} />
      </Stack>

      {/* Overlay indicator row */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {showSMA  && data.sma   != null && <LV label="SMA"  value={fmt(data.sma)}  color={CHART_COLORS.sma}  />}
        {showEMA  && data.ema   != null && <LV label="EMA"  value={fmt(data.ema)}  color={CHART_COLORS.ema}  />}
        {showVWAP && data.vwap  != null && <LV label="VWAP" value={fmt(data.vwap)} color={CHART_COLORS.vwap} />}
        {showBB   && data.bbUpper != null && (
          <>
            <LV label="BB↑" value={fmt(data.bbUpper)} color={alpha(CHART_COLORS.bbBand, 0.8)} />
            <LV label="BB↓" value={fmt(data.bbLower)} color={alpha(CHART_COLORS.bbBand, 0.8)} />
          </>
        )}
      </Stack>

      {/* RSI row */}
      {showRSI && data.rsi != null && (
        <Stack direction="row" spacing={1}>
          <LV
            label="RSI"
            value={fmt(data.rsi, 1)}
            color={
              data.rsi > 70 ? CHART_COLORS.rsi70
                : data.rsi < 30 ? CHART_COLORS.rsi30
                : CHART_COLORS.rsi
            }
          />
        </Stack>
      )}

      {/* MACD row */}
      {showMACD && data.macd != null && (
        <Stack direction="row" spacing={1}>
          <LV label="MACD"   value={fmt(data.macd,      3)} color={CHART_COLORS.macdLine} />
          <LV label="Signal" value={fmt(data.signal,    3)} color={CHART_COLORS.macdSig}  />
          <LV label="Hist"   value={fmt(data.histogram, 3)} color={data.histogram != null && data.histogram >= 0 ? CHART_COLORS.histUp : CHART_COLORS.histDown} />
        </Stack>
      )}
    </Box>
  );
}
