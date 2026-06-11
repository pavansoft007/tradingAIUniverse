"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon   from "@mui/icons-material/ArrowUpward";
import Box               from "@mui/material/Box";
import Card              from "@mui/material/Card";
import CardContent       from "@mui/material/CardContent";
import Chip              from "@mui/material/Chip";
import Pagination        from "@mui/material/Pagination";
import Skeleton          from "@mui/material/Skeleton";
import Table             from "@mui/material/Table";
import TableBody         from "@mui/material/TableBody";
import TableCell         from "@mui/material/TableCell";
import TableContainer    from "@mui/material/TableContainer";
import TableHead         from "@mui/material/TableHead";
import TableRow          from "@mui/material/TableRow";
import Typography        from "@mui/material/Typography";
import { useState }      from "react";
import { useTradeJournal } from "@/hooks/usePaperTrading";
import type { TradeData } from "@/types/paper-trading.types";

const PAGE_SIZE = 20;

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

function TradeRow({ trade }: { trade: TradeData }) {
  const isBuy = trade.transactiontype === "BUY";
  const pnlColor = trade.realizedPnl > 0 ? "success.main" : trade.realizedPnl < 0 ? "error.main" : "text.secondary";
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {new Date(trade.executedAt).toLocaleString("en-IN", {
            dateStyle: "short", timeStyle: "short",
          })}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={700}>{trade.tradingsymbol}</Typography>
        <Typography variant="caption" color="text.secondary">{trade.exchange}</Typography>
      </TableCell>
      <TableCell>
        <Chip label={trade.transactiontype} size="small"
          color={isBuy ? "success" : "error"} variant="outlined" />
      </TableCell>
      <TableCell>
        <Typography variant="caption">{trade.producttype}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">{trade.quantity}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600}>{fmt(trade.fillPrice)}</Typography>
        {trade.slippagePct > 0 && (
          <Typography variant="caption" color="warning.main" display="block">
            slip {trade.slippagePct.toFixed(3)}%
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">{fmt(trade.tradeValue)}</Typography>
      </TableCell>
      <TableCell align="right">
        {trade.closingTrade ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
            {trade.realizedPnl >= 0
              ? <ArrowUpwardIcon sx={{ fontSize: 13, color: "success.main" }} />
              : <ArrowDownwardIcon sx={{ fontSize: 13, color: "error.main" }} />}
            <Typography variant="body2" fontWeight={700} color={pnlColor}>
              {fmt(trade.realizedPnl)}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        )}
      </TableCell>
      <TableCell>
        {trade.notes && (
          <Typography variant="caption" color="text.secondary">{trade.notes}</Typography>
        )}
      </TableCell>
    </TableRow>
  );
}

export function PaperTradeJournal() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTradeJournal(page, PAGE_SIZE);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography variant="h6" fontWeight={700}>Trade Journal</Typography>
          {data && (
            <Typography variant="caption" color="text.secondary">{data.total} trades</Typography>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={40} />)}
          </Box>
        ) : !data?.trades.length ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No trades yet</Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Fill Price</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Realized P&L</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.trades.map((t) => <TradeRow key={t.id} trade={t} />)}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={totalPages} page={page} onChange={(_, v) => setPage(v)}
                  color="primary" size="small"
                />
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
