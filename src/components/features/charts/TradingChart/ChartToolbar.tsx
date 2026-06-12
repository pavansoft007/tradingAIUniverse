"use client";

import Box from "@mui/material/Box";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { CandleInterval } from "@/lib/api/angelone/market.api";
import { TIMEFRAME_OPTIONS } from "./types";

// ── Props ──────────────────────────────────────────────────────────────────────

interface IndicatorToggleState {
  showSMA:  boolean;
  showEMA:  boolean;
  showBB:   boolean;
  showVWAP: boolean;
  showRSI:  boolean;
  showMACD: boolean;
}

interface ToggleFns {
  onToggleSMA:  () => void;
  onToggleEMA:  () => void;
  onToggleBB:   () => void;
  onToggleVWAP: () => void;
  onToggleRSI:  () => void;
  onToggleMACD: () => void;
}

export interface ChartToolbarProps extends IndicatorToggleState, ToggleFns {
  title?:           string;
  interval:         CandleInterval;
  onIntervalChange: (interval: CandleInterval) => void;
  onFitContent:     () => void;
}

// ── Indicator chip helper ──────────────────────────────────────────────────────

interface IndicatorChipProps {
  label:    string;
  active:   boolean;
  color:    string;
  tooltip:  string;
  onClick:  () => void;
}

function IndicatorChip({ label, active, color, tooltip, onClick }: IndicatorChipProps) {
  return (
    <Tooltip title={tooltip} placement="bottom" arrow>
      <Chip
        label={label}
        size="small"
        onClick={onClick}
        sx={{
          height: 22,
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          cursor: "pointer",
          borderRadius: "4px",
          border: `1px solid ${active ? color : "transparent"}`,
          bgcolor: active ? alpha(color, 0.15) : "action.hover",
          color:   active ? color : "text.disabled",
          "& .MuiChip-label": { px: "6px" },
          transition: "all 0.15s",
          "&:hover": {
            bgcolor: alpha(color, active ? 0.25 : 0.08),
            color:   active ? color : "text.secondary",
          },
        }}
      />
    </Tooltip>
  );
}

// ── Main toolbar ───────────────────────────────────────────────────────────────

export function ChartToolbar({
  title,
  interval,
  onIntervalChange,
  onFitContent,
  showSMA, showEMA, showBB, showVWAP, showRSI, showMACD,
  onToggleSMA, onToggleEMA, onToggleBB, onToggleVWAP, onToggleRSI, onToggleMACD,
}: ChartToolbarProps) {
  return (
    <Box
      sx={{
        display:        "flex",
        alignItems:     "center",
        flexWrap:       "wrap",
        gap:            1,
        px:             1.5,
        py:             0.75,
        borderBottom:   1,
        borderColor:    "divider",
        bgcolor:        "background.paper",
      }}
    >
      {/* Title */}
      {title && (
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ mr: 1, fontSize: "13px", minWidth: 0, flexShrink: 0 }}
        >
          {title}
        </Typography>
      )}

      {/* Timeframe selector */}
      <ButtonGroup size="small" disableElevation>
        {TIMEFRAME_OPTIONS.map((tf) => (
          <Button
            key={tf.interval}
            onClick={() => onIntervalChange(tf.interval)}
            sx={{
              minWidth:   32,
              px:         0.5,
              py:         0.25,
              fontSize:   "10px",
              fontWeight: interval === tf.interval ? 700 : 400,
              color:      interval === tf.interval ? "primary.main" : "text.secondary",
              bgcolor:    interval === tf.interval ? (t) => alpha(t.palette.primary.main, 0.1) : "transparent",
              border:     "none !important",
              borderRadius: "4px !important",
              "&:hover":  { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
            }}
          >
            {tf.label}
          </Button>
        ))}
      </ButtonGroup>

      {/* Separator */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Indicator toggles */}
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        <IndicatorChip label="SMA"  active={showSMA}  color="#f59e0b" tooltip="Simple Moving Average (20)"    onClick={onToggleSMA}  />
        <IndicatorChip label="EMA"  active={showEMA}  color="#a78bfa" tooltip="Exponential Moving Average (20)" onClick={onToggleEMA}  />
        <IndicatorChip label="BB"   active={showBB}   color="#6366f1" tooltip="Bollinger Bands (20, 2)"       onClick={onToggleBB}   />
        <IndicatorChip label="VWAP" active={showVWAP} color="#22d3ee" tooltip="Volume Weighted Avg Price"      onClick={onToggleVWAP} />
        <IndicatorChip label="RSI"  active={showRSI}  color="#fb923c" tooltip="Relative Strength Index (14)"  onClick={onToggleRSI}  />
        <IndicatorChip label="MACD" active={showMACD} color="#60a5fa" tooltip="MACD (12, 26, 9)"              onClick={onToggleMACD} />

        {/* Fit-to-content reset */}
        <Tooltip title="Reset zoom" placement="bottom" arrow>
          <Chip
            label="⊞"
            size="small"
            onClick={onFitContent}
            sx={{
              height: 22, fontSize: "12px", cursor: "pointer",
              bgcolor: "action.hover", color: "text.secondary",
              "& .MuiChip-label": { px: "6px" },
              "&:hover": { bgcolor: "action.selected" },
            }}
          />
        </Tooltip>
      </Stack>
    </Box>
  );
}
