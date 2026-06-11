"use client";

import CloseIcon         from "@mui/icons-material/Close";
import SwapHorizIcon     from "@mui/icons-material/SwapHoriz";
import Box               from "@mui/material/Box";
import Button            from "@mui/material/Button";
import Chip              from "@mui/material/Chip";
import CircularProgress  from "@mui/material/CircularProgress";
import Divider           from "@mui/material/Divider";
import IconButton        from "@mui/material/IconButton";
import Table             from "@mui/material/Table";
import TableBody         from "@mui/material/TableBody";
import TableCell         from "@mui/material/TableCell";
import TableContainer    from "@mui/material/TableContainer";
import TableHead         from "@mui/material/TableHead";
import TableRow          from "@mui/material/TableRow";
import Tooltip           from "@mui/material/Tooltip";
import Typography        from "@mui/material/Typography";
import { alpha }         from "@mui/material/styles";
import { useMemo, useState } from "react";
import { usePositions, useConvertPosition } from "@/hooks/useAngelOrders";
import { useOrderEngine } from "@/hooks/useOrderEngine";
import { ANGEL_ORDER_TYPE, ANGEL_DURATION, ANGEL_PRODUCT_TYPE } from "@/types/angel-order.types";
import type { AngelPosition } from "@/types/angel-order.types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPnL = (n: number) => {
  const sign = n >= 0 ? "+" : "";
  return `${sign}₹${fmt(Math.abs(n))}`;
};

// ── Position Row ──────────────────────────────────────────────────────────────

interface RowProps {
  pos:          AngelPosition;
  onSquareOff:  (pos: AngelPosition) => void;
  onConvert:    (pos: AngelPosition) => void;
  squaringOff:  string | null;  // symboltoken being squared off
}

function PositionRow({ pos, onSquareOff, onConvert, squaringOff }: RowProps) {
  const netQty   = parseInt(pos.netqty, 10);
  const ltp      = parseFloat(pos.ltp    || "0");
  const pnl      = parseFloat(pos.pnl    || "0");
  const unrealised = parseFloat(pos.unrealised || "0");
  const avgPrice = parseFloat(netQty > 0 ? pos.buyavgprice : pos.sellavgprice) || 0;
  const isLong   = netQty > 0;
  const pnlColor = pnl >= 0 ? "#00D97E" : "#F23645";
  const isSquaring = squaringOff === pos.symboltoken;

  return (
    <TableRow hover sx={{ "& td": { py: 0.75, fontSize: "0.8rem" } }}>
      <TableCell>
        <Typography variant="body2" fontWeight={700}>{pos.tradingsymbol}</Typography>
        <Typography variant="caption" color="text.secondary">{pos.exchange}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={pos.producttype}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.65rem", height: 18 }}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={isLong ? "LONG" : "SHORT"}
          size="small"
          color={isLong ? "success" : "error"}
          variant="outlined"
          sx={{ fontSize: "0.65rem" }}
        />
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
        {Math.abs(netQty)}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
        ₹{fmt(avgPrice)}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
        {ltp > 0 ? `₹${fmt(ltp)}` : "–"}
      </TableCell>
      <TableCell
        align="right"
        sx={{ fontFamily: "monospace", color: pnlColor, fontWeight: 700 }}
      >
        {fmtPnL(unrealised)}
      </TableCell>
      <TableCell align="center">
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
          {/* Convert MIS → CNC */}
          {pos.producttype === ANGEL_PRODUCT_TYPE.INTRADAY && (
            <Tooltip title="Convert to Delivery (CNC)">
              <IconButton size="small" onClick={() => onConvert(pos)}>
                <SwapHorizIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
          {/* Square off */}
          <Tooltip title="Square Off">
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={isSquaring}
                onClick={() => onSquareOff(pos)}
              >
                {isSquaring
                  ? <CircularProgress size={14} />
                  : <CloseIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PositionsPanel() {
  const { data: rawPositions = [], isFetching } = usePositions();
  const { mutate: convertPosition, isPending: converting } = useConvertPosition();
  const { submitOrder } = useOrderEngine();

  const [squaringOff, setSquaringOff] = useState<string | null>(null);
  const [squaringAll, setSquaringAll] = useState(false);

  const positions = useMemo(
    () => rawPositions.filter((p) => parseInt(p.netqty, 10) !== 0),
    [rawPositions],
  );

  const totals = useMemo(() => ({
    unrealised: positions.reduce((s, p) => s + parseFloat(p.unrealised || "0"), 0),
    realised:   positions.reduce((s, p) => s + parseFloat(p.realised   || "0"), 0),
    pnl:        positions.reduce((s, p) => s + parseFloat(p.pnl        || "0"), 0),
  }), [positions]);

  const handleSquareOff = async (pos: AngelPosition) => {
    const netQty = parseInt(pos.netqty, 10);
    if (netQty === 0) return;

    setSquaringOff(pos.symboltoken);
    await submitOrder(
      {
        tradingsymbol:   pos.tradingsymbol,
        symboltoken:     pos.symboltoken,
        exchange:        pos.exchange,
        transactiontype: netQty > 0 ? "SELL" : "BUY",
        ordertype:       ANGEL_ORDER_TYPE.MARKET,
        producttype:     pos.producttype,
        duration:        ANGEL_DURATION.DAY,
        quantity:        Math.abs(netQty),
        price:           0,
        triggerprice:    0,
      },
      { source: "manual", notes: "Square off position" },
    );
    setSquaringOff(null);
  };

  const handleSquareOffAll = async () => {
    if (!positions.length) return;
    setSquaringAll(true);
    for (const pos of positions) {
      await handleSquareOff(pos);
    }
    setSquaringAll(false);
  };

  const handleConvert = (pos: AngelPosition) => {
    convertPosition({
      exchange:       pos.exchange,
      symboltoken:    pos.symboltoken,
      tradingsymbol:  pos.tradingsymbol,
      transactiontype:"BUY",
      oldproducttype: pos.producttype,
      newproducttype: ANGEL_PRODUCT_TYPE.DELIVERY,
      quantity:       Math.abs(parseInt(pos.netqty, 10)),
    });
  };

  const totalPnlColor = totals.pnl >= 0 ? "#00D97E" : "#F23645";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Open Positions
        </Typography>
        <Chip label={positions.length} size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
        {isFetching && <CircularProgress size={14} />}

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* P&L Summary */}
          {positions.length > 0 && (
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1 }}>Day P&amp;L</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: totalPnlColor, fontFamily: "monospace" }}>
                {fmtPnL(totals.unrealised)}
              </Typography>
            </Box>
          )}
          {/* Square Off All */}
          {positions.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={squaringAll || !!squaringOff || converting}
              startIcon={squaringAll ? <CircularProgress size={12} /> : <CloseIcon />}
              onClick={handleSquareOffAll}
              sx={{ fontSize: "0.7rem", py: 0.4 }}
            >
              Square Off All
            </Button>
          )}
        </Box>
      </Box>

      <Divider />

      <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ "& th": { fontSize: "0.72rem", fontWeight: 700 } }}>
              <TableCell>Symbol</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Avg Price</TableCell>
              <TableCell align="right">LTP</TableCell>
              <TableCell align="right">P&amp;L</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No open positions
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              positions.map((pos) => (
                <PositionRow
                  key={`${pos.symboltoken}-${pos.producttype}`}
                  pos={pos}
                  onSquareOff={handleSquareOff}
                  onConvert={handleConvert}
                  squaringOff={squaringOff}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total row */}
      {positions.length > 0 && (
        <>
          <Divider />
          <Box
            sx={{
              px: 2, py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 3,
              background: alpha(totalPnlColor, 0.04),
            }}
          >
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Realised</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: totals.realised >= 0 ? "#00D97E" : "#F23645", fontFamily: "monospace" }}>
                {fmtPnL(totals.realised)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Unrealised</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: totals.unrealised >= 0 ? "#00D97E" : "#F23645", fontFamily: "monospace" }}>
                {fmtPnL(totals.unrealised)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Total P&amp;L</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: totalPnlColor, fontFamily: "monospace" }}>
                {fmtPnL(totals.pnl)}
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
