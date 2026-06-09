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
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
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
        </>
      ) : (
        <>
          <Skeleton variant="text" width={80} height={20} />
          <Skeleton variant="text" width={60} height={16} />
        </>
      )}
    </Box>
  );
}
