"use client";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import Box              from "@mui/material/Box";
import Button           from "@mui/material/Button";
import Chip             from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog           from "@mui/material/Dialog";
import DialogActions    from "@mui/material/DialogActions";
import DialogContent    from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle      from "@mui/material/DialogTitle";
import Skeleton         from "@mui/material/Skeleton";
import Table            from "@mui/material/Table";
import TableBody        from "@mui/material/TableBody";
import TableCell        from "@mui/material/TableCell";
import TableContainer   from "@mui/material/TableContainer";
import TableHead        from "@mui/material/TableHead";
import TableRow         from "@mui/material/TableRow";
import Typography       from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { usePositions, useConvertPosition } from "@/hooks/useAngelOrders";
import { useOrderStore }   from "@/store/useOrderStore";
import type { AngelPosition } from "@/types/angel-order.types";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtPrice(v: number) {
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNum(s: string): number {
  return parseFloat(s || "0") || 0;
}

// ── Product type label ────────────────────────────────────────────────────────

const PRODUCT_LABEL: Record<string, string> = {
  INTRADAY:    "MIS",
  DELIVERY:    "CNC",
  CARRYFORWARD:"NRML",
  MARGIN:      "MIS",
};

// ── Convert dialog ────────────────────────────────────────────────────────────

interface ConvertDialogProps {
  position: AngelPosition | null;
  onClose:  () => void;
}

function ConvertDialog({ position, onClose }: ConvertDialogProps) {
  const { mutate, isPending } = useConvertPosition();

  if (!position) return null;

  const netQty    = fmtNum(position.netqty);
  const isBuy     = netQty >= 0;
  const absQty    = Math.abs(netQty);
  const isIntraday = position.producttype === "INTRADAY" || position.producttype === "MARGIN";
  const fromLabel  = PRODUCT_LABEL[position.producttype] ?? position.producttype;
  const toProduct  = isIntraday ? "DELIVERY" : "INTRADAY";
  const toLabel    = isIntraday ? "CNC" : "MIS";

  function handleConfirm() {
    mutate(
      {
        exchange:       position!.exchange,
        symboltoken:    position!.symboltoken,
        tradingsymbol:  position!.tradingsymbol,
        transactiontype: isBuy ? "BUY" : "SELL",
        oldproducttype: position!.producttype,
        newproducttype: toProduct,
        quantity:       absQty,
      },
      { onSettled: onClose },
    );
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Convert Position</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14 }}>
          Convert <strong>{position.tradingsymbol}</strong> ({absQty} qty) from{" "}
          <strong>{fromLabel}</strong> to <strong>{toLabel}</strong>?
        </DialogContentText>
        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: "action.hover", fontSize: 13 }}>
          <Typography variant="body2" color="text.secondary">
            MIS → CNC: positions are carried overnight as delivery holdings.
            <br />
            CNC → MIS: position becomes intraday; will auto-square off before 3:20 PM.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={onClose} disabled={isPending} size="small">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isPending}
          size="small"
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {isPending ? "Converting…" : `Convert to ${toLabel}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Position row ──────────────────────────────────────────────────────────────

function PositionRow({
  position,
  onConvert,
}: {
  position: AngelPosition;
  onConvert: (pos: AngelPosition) => void;
}) {
  const theme   = useTheme();
  const netQty  = fmtNum(position.netqty);
  const ltp     = fmtNum(position.ltp);
  const avgPrice = fmtNum(position.avgnetprice);
  const pnl     = fmtNum(position.pnl);
  const isUp    = pnl >= 0;
  const pnlColor = isUp ? theme.palette.success.main : theme.palette.error.main;
  const isIntraday = position.producttype === "INTRADAY" || position.producttype === "MARGIN";
  const productLabel = PRODUCT_LABEL[position.producttype] ?? position.producttype;

  return (
    <TableRow hover sx={{ "&:last-child td": { border: 0 } }}>
      {/* Symbol */}
      <TableCell sx={{ pl: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.01em" }}>
            {position.tradingsymbol}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            {position.exchange} · {position.instrumenttype || "EQ"}
          </Typography>
        </Box>
      </TableCell>

      {/* Product */}
      <TableCell>
        <Chip
          label={productLabel}
          size="small"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            background: isIntraday
              ? alpha(theme.palette.warning.main, 0.12)
              : alpha(theme.palette.info.main, 0.12),
            color: isIntraday ? theme.palette.warning.main : theme.palette.info.main,
            border: `1px solid ${alpha(isIntraday ? theme.palette.warning.main : theme.palette.info.main, 0.25)}`,
          }}
        />
      </TableCell>

      {/* Net Qty */}
      <TableCell align="right">
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            fontFeatureSettings: '"tnum"',
            color: netQty >= 0 ? theme.palette.success.main : theme.palette.error.main,
          }}
        >
          {netQty >= 0 ? "+" : ""}{netQty}
        </Typography>
      </TableCell>

      {/* Avg Price */}
      <TableCell align="right">
        <Typography sx={{ fontSize: 13, color: "text.secondary", fontFeatureSettings: '"tnum"' }}>
          {fmtPrice(avgPrice)}
        </Typography>
      </TableCell>

      {/* LTP */}
      <TableCell align="right">
        <Typography sx={{ fontSize: 13, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
          {fmtPrice(ltp)}
        </Typography>
      </TableCell>

      {/* P&L */}
      <TableCell align="right">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: pnlColor, fontFeatureSettings: '"tnum"' }}>
            {isUp ? "+" : ""}{fmtPrice(Math.abs(pnl))}
          </Typography>
          <Chip
            label={`${isUp ? "+" : ""}${(avgPrice > 0 ? ((ltp - avgPrice) / avgPrice) * 100 : 0).toFixed(2)}%`}
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

      {/* Actions */}
      <TableCell align="right" sx={{ pr: 2.5 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onConvert(position)}
          sx={{
            fontSize: 11,
            height: 26,
            minWidth: 80,
            borderColor: "divider",
            color: "text.secondary",
            "&:hover": { borderColor: "primary.main", color: "primary.main" },
          }}
        >
          {isIntraday ? "→ CNC" : "→ MIS"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i} align={i === 0 || i === 1 ? "left" : "right"}>
          <Skeleton height={16} width={i === 0 ? 120 : i === 1 ? 48 : 70} sx={{ ml: i > 1 ? "auto" : 0 }} />
          {i === 0 && <Skeleton height={11} width={80} />}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function PositionsTable() {
  const [convertTarget, setConvertTarget] = useState<AngelPosition | null>(null);

  // Trigger the positions query and keep store in sync
  usePositions();

  // Read from store directly (stable primitive reference)
  const allPositions = useOrderStore((s) => s.positions);
  const openPositions = useMemo(
    () => allPositions.filter((p) => parseInt(p.netqty, 10) !== 0),
    [allPositions],
  );

  // Aggregate totals
  const totals = useMemo(() => {
    let totalPnL = 0;
    for (const p of openPositions) totalPnL += fmtNum(p.pnl);
    return { totalPnL };
  }, [openPositions]);

  // Derive isLoading from store: no positions yet and jwt exists — treat as loading
  const isLoading = allPositions.length === 0;

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.5, fontWeight: 700, minWidth: 160 }}>Symbol</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 60 }}>Product</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 80 }}>Net Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 100 }}>Avg Price</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 100 }}>LTP</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 130 }}>P&amp;L</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 100, pr: 2.5 }}>Convert</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : openPositions.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No open positions — intraday and F&amp;O positions appear here
                    </Typography>
                  </TableCell>
                </TableRow>
              )
              : openPositions.map((pos) => (
                <PositionRow
                  key={`${pos.exchange}-${pos.symboltoken}-${pos.producttype}`}
                  position={pos}
                  onConvert={setConvertTarget}
                />
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary footer */}
      {!isLoading && openPositions.length > 0 && (() => {
        const isUp = totals.totalPnL >= 0;
        return (
          <Box
            sx={{
              px: 2.5,
              py: 1.25,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {openPositions.length} open position{openPositions.length !== 1 ? "s" : ""}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Total P&amp;L</Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  fontFeatureSettings: '"tnum"',
                  color: isUp ? "success.main" : "error.main",
                }}
              >
                {isUp ? "+" : ""}{fmtPrice(Math.abs(totals.totalPnL))}
              </Typography>
            </Box>
          </Box>
        );
      })()}

      <ConvertDialog
        position={convertTarget}
        onClose={() => setConvertTarget(null)}
      />
    </>
  );
}
