"use client";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { PriceCell } from "@/components/features/market/PriceCell";
import { useTickData } from "@/hooks/useMarketWatch";
import type { ExchangeType } from "@/types/smartws.types";
import { EXCHANGE_TYPE, WS_MODE } from "@/types/smartws.types";

// ── Position data with Angel One token IDs ─────────────────────────────────────

export interface PositionItem {
  symbol: string;
  name: string;
  token: string;
  exchangeType: ExchangeType;
  qty: number;
  avgEntry: number;
  alloc: number;
}

export const PORTFOLIO_POSITIONS: PositionItem[] = [
  { symbol: "RELIANCE",   name: "Reliance Industries", token: "2885",  exchangeType: EXCHANGE_TYPE.NSE_CM, qty: 25, avgEntry: 2420, alloc: 28.4 },
  { symbol: "TCS",        name: "Tata Consultancy",    token: "11536", exchangeType: EXCHANGE_TYPE.NSE_CM, qty: 15, avgEntry: 3350, alloc: 23.1 },
  { symbol: "HDFCBANK",   name: "HDFC Bank",           token: "1333",  exchangeType: EXCHANGE_TYPE.NSE_CM, qty: 40, avgEntry: 1560, alloc: 28.7 },
  { symbol: "INFY",       name: "Infosys",             token: "1594",  exchangeType: EXCHANGE_TYPE.NSE_CM, qty: 30, avgEntry: 1480, alloc: 17.5 },
  { symbol: "WIPRO",      name: "Wipro",               token: "3787",  exchangeType: EXCHANGE_TYPE.NSE_CM, qty: 20, avgEntry: 520,  alloc: 4.1  },
  { symbol: "BAJFINANCE", name: "Bajaj Finance",       token: "317",   exchangeType: EXCHANGE_TYPE.NSE_CM, qty: 5,  avgEntry: 6800, alloc: 15.2 },
];

// Fallback LTP when WebSocket is not connected (last known price from mock)
const FALLBACK_LTP: Record<string, number> = {
  "2885":  2710,
  "11536": 3682,
  "1333":  1713,
  "1594":  1390,
  "3787":  496,
  "317":   7250,
};

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtPrice(p: number) {
  return `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Single live row ────────────────────────────────────────────────────────────

function LiveRow({ position }: { position: PositionItem }) {
  const theme = useTheme();
  const tick  = useTickData(position.token, position.exchangeType, WS_MODE.LTP);
  const ltp   = tick?.ltp ?? FALLBACK_LTP[position.token] ?? position.avgEntry;

  const pnl       = (ltp - position.avgEntry) * position.qty;
  const pnlPct    = ((ltp - position.avgEntry) / position.avgEntry) * 100;
  const curValue  = ltp * position.qty;
  const isUp      = pnl >= 0;
  const pnlColor  = isUp ? theme.palette.success.main : theme.palette.error.main;

  return (
    <TableRow hover sx={{ "&:last-child td": { border: 0 } }}>
      {/* Symbol */}
      <TableCell sx={{ pl: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.01em" }}>
            {position.symbol}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{position.name}</Typography>
        </Box>
      </TableCell>

      {/* Qty */}
      <TableCell align="right">
        <Typography sx={{ fontSize: 13, fontFeatureSettings: '"tnum"' }}>{position.qty}</Typography>
      </TableCell>

      {/* Avg Entry */}
      <TableCell align="right">
        <Typography sx={{ fontSize: 13, color: "text.secondary", fontFeatureSettings: '"tnum"' }}>
          {fmtPrice(position.avgEntry)}
        </Typography>
      </TableCell>

      {/* LTP — live with flash animation */}
      <TableCell align="right">
        <PriceCell price={ltp} prevClose={position.avgEntry} formatFn={fmtPrice} />
      </TableCell>

      {/* P&L */}
      <TableCell align="right">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: pnlColor,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {isUp ? "+" : ""}
            {fmtPrice(Math.abs(pnl))}
          </Typography>
          <Chip
            label={`${isUp ? "+" : ""}${pnlPct.toFixed(2)}%`}
            size="small"
            icon={
              isUp ? (
                <TrendingUpIcon sx={{ fontSize: "11px !important", color: `${pnlColor} !important` }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: "11px !important", color: `${pnlColor} !important` }} />
              )
            }
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              background: alpha(pnlColor, 0.12),
              color: pnlColor,
              border: `1px solid ${alpha(pnlColor, 0.25)}`,
            }}
          />
        </Box>
      </TableCell>

      {/* Current value */}
      <TableCell align="right">
        <Typography sx={{ fontSize: 13, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
          {fmtPrice(curValue)}
        </Typography>
      </TableCell>

      {/* Allocation bar */}
      <TableCell align="right" sx={{ pr: 2.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{position.alloc}%</Typography>
          <LinearProgress
            variant="determinate"
            value={position.alloc}
            sx={{
              width: 64,
              height: 4,
              borderRadius: 2,
              background: alpha(theme.palette.primary.main, 0.12),
              "& .MuiLinearProgress-bar": {
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              },
            }}
          />
        </Box>
      </TableCell>
    </TableRow>
  );
}

// ── Skeleton rows for loading state ───────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i} align={i === 0 ? "left" : "right"}>
          <Skeleton height={16} width={i === 0 ? 100 : 70} sx={{ ml: i !== 0 ? "auto" : 0 }} />
          {i === 0 && <Skeleton height={12} width={130} />}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Summary row ────────────────────────────────────────────────────────────────

function SummaryRow({ positions }: { positions: PositionItem[] }) {
  const theme = useTheme();

  const { totalValue, totalPnL } = useMemo(() => {
    return positions.reduce(
      (acc, pos) => {
        const ltp      = FALLBACK_LTP[pos.token] ?? pos.avgEntry;
        const curValue = ltp * pos.qty;
        const pnl      = (ltp - pos.avgEntry) * pos.qty;
        acc.totalValue += curValue;
        acc.totalPnL   += pnl;
        return acc;
      },
      { totalValue: 0, totalPnL: 0 },
    );
  }, [positions]);

  const isUp = totalPnL >= 0;
  const color = isUp ? theme.palette.success.main : theme.palette.error.main;
  const pnlPct = (totalPnL / (totalValue - totalPnL)) * 100;

  return (
    <>
      <TableRow
        sx={{
          bgcolor: isUp
            ? alpha(theme.palette.success.main, 0.04)
            : alpha(theme.palette.error.main, 0.04),
        }}
      >
        <TableCell colSpan={5} sx={{ pl: 2.5, py: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
            Total ({positions.length} holdings)
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Total current value">
            <Typography sx={{ fontSize: 13, fontWeight: 800, fontFeatureSettings: '"tnum"' }}>
              {fmtPrice(totalValue)}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="right" sx={{ pr: 2.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color, fontFeatureSettings: '"tnum"' }}>
              {isUp ? "+" : ""}
              {fmtPrice(Math.abs(totalPnL))}
            </Typography>
            <Typography sx={{ fontSize: 11, color, fontWeight: 600 }}>
              {isUp ? "+" : ""}
              {pnlPct.toFixed(2)}%
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface LivePositionsTableProps {
  positions?: PositionItem[];
  loading?: boolean;
}

export function LivePositionsTable({
  positions = PORTFOLIO_POSITIONS,
  loading = false,
}: LivePositionsTableProps) {
  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.5, fontWeight: 700, minWidth: 160 }}>Symbol</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 60 }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 100 }}>Avg Entry</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 110 }}>LTP (Live)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 130 }}>P&amp;L</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 110 }}>Value</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 100, pr: 2.5 }}>Alloc.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              : positions.map((pos) => <LiveRow key={pos.symbol} position={pos} />)}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && (
        <>
          <Divider />
          <Table size="small">
            <TableBody>
              <SummaryRow positions={positions} />
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
}
