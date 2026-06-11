"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon   from "@mui/icons-material/ArrowUpward";
import Box               from "@mui/material/Box";
import Button            from "@mui/material/Button";
import Card              from "@mui/material/Card";
import CardContent       from "@mui/material/CardContent";
import Chip              from "@mui/material/Chip";
import Skeleton          from "@mui/material/Skeleton";
import Table             from "@mui/material/Table";
import TableBody         from "@mui/material/TableBody";
import TableCell         from "@mui/material/TableCell";
import TableContainer    from "@mui/material/TableContainer";
import TableHead         from "@mui/material/TableHead";
import TableRow          from "@mui/material/TableRow";
import Typography        from "@mui/material/Typography";
import { usePaperPositions, useSquareOffMis } from "@/hooks/usePaperTrading";
import type { PositionData } from "@/types/paper-trading.types";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}
function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function PnlCell({ value, pct }: { value: number; pct?: number }) {
  const color = value >= 0 ? "success.main" : "error.main";
  return (
    <TableCell align="right">
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Typography variant="body2" fontWeight={700} color={color} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {value >= 0 ? <ArrowUpwardIcon sx={{ fontSize: 13 }} /> : <ArrowDownwardIcon sx={{ fontSize: 13 }} />}
          {fmt(Math.abs(value))}
        </Typography>
        {pct !== undefined && (
          <Typography variant="caption" color={color}>{fmtPct(pct)}</Typography>
        )}
      </Box>
    </TableCell>
  );
}

function PositionRow({ pos }: { pos: PositionData }) {
  const isLong = pos.netQty > 0;
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight={700}>{pos.tradingsymbol}</Typography>
        <Typography variant="caption" color="text.secondary">{pos.exchange} · {pos.producttype}</Typography>
      </TableCell>
      <TableCell>
        <Chip label={isLong ? "LONG" : "SHORT"} size="small"
          color={isLong ? "success" : "error"} variant="outlined" />
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600}>{Math.abs(pos.netQty)}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">{fmt(pos.avgBuyPrice || pos.avgSellPrice)}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600}>{fmt(pos.ltp)}</Typography>
      </TableCell>
      <PnlCell value={pos.unrealizedPnl} pct={pos.unrealizedPct} />
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">{fmt(pos.currentValue)}</Typography>
      </TableCell>
    </TableRow>
  );
}

export function PaperPositionsTable() {
  const { data: positions, isLoading } = usePaperPositions();
  const squareOff = useSquareOffMis();

  const hasMis = positions?.some((p) => p.producttype === "MIS") ?? false;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography variant="h6" fontWeight={700}>Open Positions</Typography>
          {hasMis && (
            <Button size="small" variant="outlined" color="warning"
              disabled={squareOff.isPending}
              onClick={() => squareOff.mutate()}>
              Square Off MIS
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={40} />)}
          </Box>
        ) : !positions?.length ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No open positions</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Avg Price</TableCell>
                  <TableCell align="right">LTP</TableCell>
                  <TableCell align="right">Unrealized P&L</TableCell>
                  <TableCell align="right">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((pos) => <PositionRow key={pos.id} pos={pos} />)}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Totals */}
        {positions && positions.length > 0 && (
          <>
            <Box sx={{ borderTop: 1, borderColor: "divider", mt: 1, pt: 1, display: "flex", justifyContent: "flex-end", gap: 4 }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.secondary">Total Unrealized P&L</Typography>
                <Typography variant="body1" fontWeight={700}
                  color={positions.reduce((s, p) => s + p.unrealizedPnl, 0) >= 0 ? "success.main" : "error.main"}>
                  {fmt(positions.reduce((s, p) => s + p.unrealizedPnl, 0))}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
