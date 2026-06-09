"use client";

import { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useOrderBook, useCancelOrder } from "@/hooks/useAngelOrders";
import { selectOpenOrders, selectFilledOrders } from "@/store/useOrderStore";
import { useOrderStore } from "@/store/useOrderStore";
import { ANGEL_VARIETY } from "@/types/angel-order.types";
import type { AngelOrder } from "@/types/angel-order.types";

// ── Status chip config ────────────────────────────────────────────────────────

type ChipColor = "success" | "error" | "warning" | "info" | "default";

const STATUS_COLOR: Record<string, ChipColor> = {
  complete:              "success",
  rejected:              "error",
  cancelled:             "error",
  open:                  "info",
  pending:               "warning",
  "trigger pending":     "warning",
  "AMO REQ RECEIVED":    "default",
  "modify pending":      "warning",
  "cancel pending":      "warning",
};

function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      size="small"
      color={STATUS_COLOR[status] ?? "default"}
      sx={{ textTransform: "capitalize", fontSize: "0.68rem" }}
    />
  );
}

// ── Single row ────────────────────────────────────────────────────────────────

interface RowProps {
  order:      AngelOrder;
  canCancel:  boolean;
  onCancel:   (order: AngelOrder) => void;
  cancelling: boolean;
}

function OrderRow({ order, canCancel, onCancel, cancelling }: RowProps) {
  const isBuy = order.transactiontype === "BUY";

  return (
    <TableRow hover sx={{ "& td": { py: 0.75, fontSize: "0.8rem" } }}>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>{order.tradingsymbol}</Typography>
        <Typography variant="caption" color="text.secondary">{order.exchange}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={order.transactiontype}
          size="small"
          color={isBuy ? "success" : "error"}
          variant="outlined"
          sx={{ fontSize: "0.68rem", minWidth: 36 }}
        />
      </TableCell>
      <TableCell>{order.ordertype}</TableCell>
      <TableCell align="right">{order.quantity}</TableCell>
      <TableCell align="right">
        {order.price > 0 ? `₹${order.price.toLocaleString("en-IN")}` : "MKT"}
      </TableCell>
      <TableCell align="right">
        {order.averageprice > 0
          ? `₹${order.averageprice.toLocaleString("en-IN")}`
          : "–"}
      </TableCell>
      <TableCell align="center">
        <StatusChip status={order.status} />
      </TableCell>
      <TableCell>{order.updatetime || "–"}</TableCell>
      <TableCell align="center">
        {canCancel && (
          <Tooltip title="Cancel order">
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={cancelling}
                onClick={() => onCancel(order)}
              >
                {cancelling
                  ? <CircularProgress size={14} />
                  : <CancelOutlinedIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type TabId = "all" | "open" | "complete";

export function OrderBook() {
  const [tab, setTab] = useState<TabId>("all");

  const { isFetching } = useOrderBook();
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder();

  const allOrders    = useOrderStore((s) => s.orders);
  const openOrders   = useOrderStore(selectOpenOrders);
  const filledOrders = useOrderStore(selectFilledOrders);

  const rows: AngelOrder[] =
    tab === "open"    ? openOrders
    : tab === "complete" ? filledOrders
    : allOrders;

  const isOpen = (o: AngelOrder) =>
    ["open", "pending", "trigger pending", "AMO REQ RECEIVED"].includes(o.status);

  const handleCancel = (order: AngelOrder) => {
    cancelOrder({ variety: order.variety ?? ANGEL_VARIETY.NORMAL, orderid: order.orderid });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, pt: 1.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ flex: 1, "& .MuiTab-root": { minHeight: 36, py: 0.5, fontSize: "0.8rem" } }}
        >
          <Tab value="all"      label={`All (${allOrders.length})`} />
          <Tab value="open"     label={`Open (${openOrders.length})`} />
          <Tab value="complete" label={`Filled (${filledOrders.length})`} />
        </Tabs>
        {isFetching && <CircularProgress size={16} />}
      </Box>

      <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ "& th": { fontSize: "0.72rem", fontWeight: 700 } }}>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Avg Price</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Time</TableCell>
              <TableCell align="center" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No orders
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((o) => (
                <OrderRow
                  key={o.orderid}
                  order={o}
                  canCancel={isOpen(o)}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
