"use client";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import Box              from "@mui/material/Box";
import Chip             from "@mui/material/Chip";
import Divider          from "@mui/material/Divider";
import LinearProgress   from "@mui/material/LinearProgress";
import Skeleton         from "@mui/material/Skeleton";
import Table            from "@mui/material/Table";
import TableBody        from "@mui/material/TableBody";
import TableCell        from "@mui/material/TableCell";
import TableContainer   from "@mui/material/TableContainer";
import TableHead        from "@mui/material/TableHead";
import TableRow         from "@mui/material/TableRow";
import Tooltip          from "@mui/material/Tooltip";
import Typography       from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useMemo }      from "react";
import { PriceCell }    from "@/components/features/market/PriceCell";
import { useHoldingsAsPositions } from "@/hooks/usePortfolio";
import { useTickData }  from "@/hooks/useMarketWatch";
import type { ExchangeType } from "@/types/smartws.types";
import { WS_MODE } from "@/types/smartws.types";

// ── Position shape ─────────────────────────────────────────────────────────────

export interface PositionItem {
  symbol:       string;
  name:         string;
  token:        string;
  exchangeType: ExchangeType;
  qty:          number;
  avgEntry:     number;
  alloc:        number;
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtPrice(p: number) {
  return `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Single live row ────────────────────────────────────────────────────────────

function LiveRow({ position }: { position: PositionItem }) {
  const theme = useTheme();
  // Subscribe to WebSocket LTP for this token
  const tick  = useTickData(position.token, position.exchangeType, WS_MODE.LTP);
  // Fall back to avgEntry if no live tick yet (pre-market / offline)
  const ltp   = tick?.ltp ?? position.avgEntry;

  const pnl      = (ltp - position.avgEntry) * position.qty;
  const pnlPct   = position.avgEntry > 0 ? ((ltp - position.avgEntry) / position.avgEntry) * 100 : 0;
  const curValue = ltp * position.qty;
  const isUp     = pnl >= 0;
  const pnlColor = isUp ? theme.palette.success.main : theme.palette.error.main;

  return (
    <TableRow hover sx={{ "&:last-child td": { border: 0 } }}>
      <TableCell sx={{ pl: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.01em" }}>
            {position.symbol}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{position.name}</Typography>
        </Box>
      </TableCell>

      <TableCell align="right">
        <Typography sx={{ fontSize: 13, fontFeatureSettings: '"tnum"' }}>{position.qty}</Typography>
      </TableCell>

      <TableCell align="right">
        <Typography sx={{ fontSize: 13, color: "text.secondary", fontFeatureSettings: '"tnum"' }}>
          {fmtPrice(position.avgEntry)}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <PriceCell price={ltp} prevClose={position.avgEntry} formatFn={fmtPrice} />
      </TableCell>

      <TableCell align="right">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: pnlColor, fontFeatureSettings: '"tnum"' }}>
            {isUp ? "+" : ""}{fmtPrice(Math.abs(pnl))}
          </Typography>
          <Chip
            label={`${isUp ? "+" : ""}${pnlPct.toFixed(2)}%`}
            size="small"
            icon={isUp
              ? <TrendingUpIcon   sx={{ fontSize: "11px !important", color: `${pnlColor} !important` }} />
              : <TrendingDownIcon sx={{ fontSize: "11px !important", color: `${pnlColor} !important` }} />}
            sx={{
              height: 18, fontSize: 10, fontWeight: 700,
              background: alpha(pnlColor, 0.12),
              color: pnlColor,
              border: `1px solid ${alpha(pnlColor, 0.25)}`,
            }}
          />
        </Box>
      </TableCell>

      <TableCell align="right">
        <Typography sx={{ fontSize: 13, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
          {fmtPrice(curValue)}
        </Typography>
      </TableCell>

      <TableCell align="right" sx={{ pr: 2.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{position.alloc}%</Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(position.alloc, 100)}
            sx={{
              width: 64, height: 4, borderRadius: 2,
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

// ── Skeleton loading rows ──────────────────────────────────────────────────────

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

  // Use avgEntry × qty as a rough total since live LTP hooks can't run in memo
  const totalCost = useMemo(
    () => positions.reduce((acc, pos) => acc + pos.avgEntry * pos.qty, 0),
    [positions],
  );

  // totalPnL will be 0 here since both use avgEntry — live rows already show real PnL individually

  return (
    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
      <TableCell colSpan={5} sx={{ pl: 2.5, py: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
          Total · {positions.length} holding{positions.length !== 1 ? "s" : ""}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Invested value (avg × qty)">
          <Typography sx={{ fontSize: 13, fontWeight: 800, fontFeatureSettings: '"tnum"' }}>
            {fmtPrice(totalCost)}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell align="right" sx={{ pr: 2.5 }}>
        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Live rows above</Typography>
      </TableCell>
    </TableRow>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface LivePositionsTableProps {
  /** Override positions (e.g. from parent page that already fetched). */
  positions?: PositionItem[];
  loading?:   boolean;
}

export function LivePositionsTable({ positions: propPositions, loading: propLoading }: LivePositionsTableProps) {
  // If caller doesn't supply positions, fetch from Angel One holdings API
  const { positions: apiPositions, isLoading: apiLoading } = useHoldingsAsPositions();

  const positions = propPositions ?? apiPositions;
  const loading   = propLoading  ?? apiLoading;

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.5, fontWeight: 700, minWidth: 160 }}>Symbol</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 60 }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 100 }}>Avg Price</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 110 }}>LTP (Live)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 130 }}>P&amp;L</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 110 }}>Value</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 100, pr: 2.5 }}>Alloc.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              : positions.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No holdings — log in to Angel One to see your portfolio
                    </Typography>
                  </TableCell>
                </TableRow>
              )
              : positions.map((pos) => <LiveRow key={`${pos.token}-${pos.symbol}`} position={pos} />)}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && positions.length > 0 && (
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
