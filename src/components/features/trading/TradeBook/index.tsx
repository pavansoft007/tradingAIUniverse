"use client";

import {
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTradeBook } from "@/hooks/useAngelOrders";
import { useOrderStore } from "@/store/useOrderStore";

export function TradeBook() {
  const { isFetching } = useTradeBook();
  const trades = useOrderStore((s) => s.trades);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Trade Book
        </Typography>
        <Chip label={trades.length} size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
        {isFetching && <CircularProgress size={14} />}
      </Box>

      <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ "& th": { fontSize: "0.72rem", fontWeight: 700 } }}>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Fill Price</TableCell>
              <TableCell align="right">Fill Qty</TableCell>
              <TableCell align="right">Trade Value</TableCell>
              <TableCell>Fill Time</TableCell>
              <TableCell>Order ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No trades today
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              trades.map((t) => {
                const isBuy = t.transactiontype === "BUY";
                const value = parseFloat(t.tradevalue);
                return (
                  <TableRow
                    key={`${t.orderid}-${t.fillid}`}
                    hover
                    sx={{ "& td": { py: 0.75, fontSize: "0.8rem" } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {t.tradingsymbol}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.exchange}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.transactiontype}
                        size="small"
                        color={isBuy ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontSize: "0.68rem", minWidth: 36 }}
                      />
                    </TableCell>
                    <TableCell>{t.producttype}</TableCell>
                    <TableCell align="right">
                      ₹{parseFloat(t.fillprice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">{t.fillsize}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: isBuy ? "success.main" : "error.main", fontWeight: 600 }}
                    >
                      {isNaN(value)
                        ? t.tradevalue
                        : `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                    </TableCell>
                    <TableCell>{t.filltime || "–"}</TableCell>
                    <TableCell sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                      {t.orderid}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
