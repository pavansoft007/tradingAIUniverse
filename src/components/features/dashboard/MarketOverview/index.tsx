"use client";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTickers } from "@/hooks/useMarketData";
import { MOCK_TICKERS } from "@/lib/mock/market.mock";

function TickerRow({ symbol, name, price, changePercent }: { symbol: string; name: string; price: number; changePercent: number }) {
  const isUp = changePercent >= 0;
  const color = isUp ? "#00D97E" : "#F23645";
  const Icon  = isUp ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2.5,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
        "&:hover": { background: "rgba(255,255,255,0.02)", cursor: "pointer" },
        transition: "background 0.15s",
      }}
    >
      {/* Symbol dot */}
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "9px",
          background: `${color}14`,
          border: `1px solid ${color}25`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          mr: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 10, fontWeight: 800, color, letterSpacing: "-0.01em" }}>
          {symbol.slice(0, 3)}
        </Typography>
      </Box>

      {/* Name */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }} noWrap>
          {symbol}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "text.secondary" }} noWrap>
          {name}
        </Typography>
      </Box>

      {/* Price + change */}
      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.4 }}>
          <Icon sx={{ fontSize: 11, color }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700, color }}>
            {isUp ? "+" : ""}
            {changePercent.toFixed(2)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function MarketOverview() {
  const { data, isLoading } = useTickers();
  const tickers = data?.data ?? MOCK_TICKERS;

  return (
    <Card sx={{ height: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
          Market Overview
        </Typography>
        <Chip
          label="Live"
          size="small"
          icon={
            <Box
              component="span"
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00D97E",
                display: "inline-block",
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                ml: "6px !important",
                mr: "-2px !important",
              }}
            />
          }
          sx={{
            height: 22,
            fontSize: 10,
            fontWeight: 700,
            background: "rgba(0,217,126,0.12)",
            color: "#00D97E",
            border: "1px solid rgba(0,217,126,0.25)",
          }}
        />
      </Box>

      <CardContent sx={{ p: 0 }}>
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Skeleton variant="rounded" width={34} height={34} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="60%" height={12} />
                </Box>
                <Box>
                  <Skeleton width={70} height={14} />
                  <Skeleton width={50} height={12} />
                </Box>
              </Box>
            ))
          : tickers.slice(0, 8).map((t) => (
              <TickerRow
                key={t.symbol}
                symbol={t.symbol}
                name={t.name}
                price={t.price}
                changePercent={t.changePercent}
              />
            ))}
      </CardContent>
    </Card>
  );
}
