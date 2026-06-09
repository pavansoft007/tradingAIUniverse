"use client";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { PriceCell } from "@/components/features/market/PriceCell";
import { useTickData } from "@/hooks/useMarketWatch";
import type { ExchangeType, WsMode } from "@/types/smartws.types";
import { EXCHANGE_LABEL } from "@/types/smartws.types";

interface LiveTickerProps {
  symbol: string;
  token: string;
  exchangeType: ExchangeType;
  mode?: WsMode;
}

function fmtVol(v: number) {
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000)    return `${(v / 100_000).toFixed(2)} L`;
  return v.toLocaleString("en-IN");
}

export function LiveTicker({ symbol, token, exchangeType, mode }: LiveTickerProps) {
  const tick = useTickData(token, exchangeType, mode);

  const change =
    tick?.ltp !== undefined && tick?.close !== undefined && tick.close !== 0
      ? tick.ltp - tick.close
      : undefined;
  const changePct =
    change !== undefined && tick?.close !== undefined && tick.close !== 0
      ? (change / tick.close) * 100
      : undefined;

  const isUp = (change ?? 0) >= 0;

  // Position of LTP within today's H/L range (clamped 2–98%)
  const rangePos =
    tick?.high !== undefined &&
    tick?.low !== undefined &&
    tick?.ltp !== undefined &&
    tick.high !== tick.low
      ? Math.min(
          Math.max(
            Math.round(((tick.ltp - tick.low) / (tick.high - tick.low)) * 100),
            2,
          ),
          98,
        )
      : undefined;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 1.5,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        minWidth: 140,
        height: "100%",
      }}
    >
      {/* Symbol + exchange */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Typography variant="caption" fontWeight={700} color="text.primary">
          {symbol}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {EXCHANGE_LABEL[exchangeType] ?? "—"}
        </Typography>
      </Box>

      {tick ? (
        <>
          <PriceCell price={tick.ltp} prevClose={tick.close} align="left" />

          {/* Change row */}
          {change !== undefined && changePct !== undefined && (
            <Tooltip title="Change vs. prev. close" placement="bottom">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mt: 0.25 }}>
                {isUp ? (
                  <TrendingUpIcon sx={{ fontSize: 13, color: "success.main" }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 13, color: "error.main" }} />
                )}
                <Typography
                  variant="caption"
                  color={isUp ? "success.main" : "error.main"}
                  fontWeight={600}
                >
                  {isUp ? "+" : ""}
                  {change.toFixed(2)} ({isUp ? "+" : ""}
                  {changePct.toFixed(2)}%)
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Day H/L range bar */}
          {rangePos !== undefined && tick.low !== undefined && tick.high !== undefined && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
                <Typography sx={{ fontSize: 9, color: "text.disabled" }}>
                  L {tick.low.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </Typography>
                <Typography sx={{ fontSize: 9, color: "text.disabled" }}>
                  H {tick.high.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Box
                sx={{
                  position: "relative",
                  height: 4,
                  bgcolor: "action.hover",
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${rangePos}%`,
                    bgcolor: isUp ? "success.main" : "error.main",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Volume */}
          {tick.volumeTradedToday !== undefined && (
            <Typography sx={{ mt: 0.75, fontSize: 10, color: "text.disabled" }}>
              Vol: {fmtVol(tick.volumeTradedToday)}
            </Typography>
          )}
        </>
      ) : (
        <>
          <Skeleton variant="text" width={80} height={20} />
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={4}
            sx={{ mt: 1, borderRadius: 1 }}
          />
          <Skeleton variant="text" width={50} height={14} sx={{ mt: 0.75 }} />
        </>
      )}
    </Box>
  );
}
