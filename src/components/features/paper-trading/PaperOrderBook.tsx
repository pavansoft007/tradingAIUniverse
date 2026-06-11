"use client";

import CancelIcon      from "@mui/icons-material/Cancel";
import Box             from "@mui/material/Box";
import Card            from "@mui/material/Card";
import CardContent     from "@mui/material/CardContent";
import Chip            from "@mui/material/Chip";
import IconButton      from "@mui/material/IconButton";
import Skeleton        from "@mui/material/Skeleton";
import Table           from "@mui/material/Table";
import TableBody       from "@mui/material/TableBody";
import TableCell       from "@mui/material/TableCell";
import TableContainer  from "@mui/material/TableContainer";
import TableHead       from "@mui/material/TableHead";
import TableRow        from "@mui/material/TableRow";
import Tab             from "@mui/material/Tab";
import Tabs            from "@mui/material/Tabs";
import Tooltip         from "@mui/material/Tooltip";
import Typography      from "@mui/material/Typography";
import { useState }    from "react";
import { usePaperOrders } from "@/hooks/usePaperTrading";
import type { PaperOrderData } from "@/types/paper-trading.types";

const STATUS_COLOR: Record<string, "success" | "error" | "warning" | "info" | "default"> = {
  FILLED:    "success",
  REJECTED:  "error",
  CANCELLED: "default",
  PENDING:   "warning",
  OPEN:      "info",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

function OrderRow({ order, onCancel }: { order: PaperOrderData; onCancel?: (id: string) => void }) {
  const canCancel = order.status === "PENDING";
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight={700}>{order.tradingsymbol}</Typography>
        <Typography variant="caption" color="text.secondary">{order.exchange} · {order.producttype}</Typography>
      </TableCell>
      <TableCell>
        <Chip label={order.transactiontype} size="small"
          color={order.transactiontype === "BUY" ? "success" : "error"} variant="outlined" />
      </TableCell>
      <TableCell>
        <Typography variant="caption">{order.ordertype.replace("_", "-")}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">{order.quantity}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {order.avgFillPrice > 0 ? fmt(order.avgFillPrice) : order.price > 0 ? fmt(order.price) : "Market"}
        </Typography>
        {order.slippagePct > 0 && (
          <Typography variant="caption" color="warning.main">slip {order.slippagePct.toFixed(3)}%</Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip label={order.status} size="small" color={STATUS_COLOR[order.status] ?? "default"} />
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {new Date(order.placedAt).toLocaleTimeString("en-IN")}
        </Typography>
      </TableCell>
      <TableCell>
        {canCancel && (
          <Tooltip title="Cancel order">
            <IconButton size="small" color="error" onClick={() => onCancel?.(order.id)}>
              <CancelIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
        {order.rejectionReason && (
          <Tooltip title={order.rejectionReason}>
            <Typography variant="caption" color="error.main" sx={{ cursor: "help" }}>Why?</Typography>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

const TABS: { label: string; status?: string }[] = [
  { label: "All" },
  { label: "Pending",   status: "PENDING" },
  { label: "Filled",    status: "FILLED" },
  { label: "Cancelled", status: "CANCELLED" },
];

export function PaperOrderBook() {
  const [tab, setTab] = useState(0);
  const { status } = TABS[tab] ?? {};
  const { data: orders, isLoading, cancelOrder } = usePaperOrders(status);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>Order Book</Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1.5 }} textColor="primary" indicatorColor="primary">
          {TABS.map((t, i) => <Tab key={i} label={t.label} sx={{ fontSize: 12, minHeight: 36 }} />)}
        </Tabs>

        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={40} />)}
          </Box>
        ) : !orders?.length ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No orders</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 360 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Price / Fill</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    onCancel={(id) => cancelOrder.mutate(id)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
