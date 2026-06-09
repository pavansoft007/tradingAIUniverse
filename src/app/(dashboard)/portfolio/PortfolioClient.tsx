"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import type { Position } from "@/types/portfolio.types";

const MOCK_POSITIONS: Position[] = [
  {
    id: "1",
    symbol: "BTCUSDT",
    name: "Bitcoin",
    quantity: 1.5,
    avgEntryPrice: 60000,
    currentPrice: 67500,
    marketValue: 101250,
    unrealizedPnl: 11250,
    unrealizedPnlPercent: 12.5,
    allocation: 42.3,
  },
  {
    id: "2",
    symbol: "ETHUSDT",
    name: "Ethereum",
    quantity: 20,
    avgEntryPrice: 3200,
    currentPrice: 3580,
    marketValue: 71600,
    unrealizedPnl: 7600,
    unrealizedPnlPercent: 11.875,
    allocation: 29.9,
  },
];

const columns: Column<Position>[] = [
  { id: "symbol", label: "Symbol", sortable: true },
  { id: "name", label: "Name" },
  {
    id: "quantity",
    label: "Quantity",
    align: "right",
    render: (row) => row.quantity.toLocaleString(),
  },
  {
    id: "avgEntryPrice",
    label: "Avg Entry",
    align: "right",
    render: (row) => `$${row.avgEntryPrice.toLocaleString()}`,
  },
  {
    id: "currentPrice",
    label: "Current Price",
    align: "right",
    render: (row) => `$${row.currentPrice.toLocaleString()}`,
  },
  {
    id: "marketValue",
    label: "Market Value",
    align: "right",
    render: (row) => `$${row.marketValue.toLocaleString()}`,
  },
  {
    id: "unrealizedPnl",
    label: "Unrealized P&L",
    align: "right",
    render: (row) => (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
        <Typography
          variant="body2"
          color={row.unrealizedPnl >= 0 ? "success.main" : "error.main"}
          fontWeight={600}
        >
          {row.unrealizedPnl >= 0 ? "+" : ""}${row.unrealizedPnl.toLocaleString()}
        </Typography>
        <Chip
          label={`${row.unrealizedPnlPercent >= 0 ? "+" : ""}${row.unrealizedPnlPercent.toFixed(2)}%`}
          color={row.unrealizedPnlPercent >= 0 ? "success" : "error"}
          size="small"
          sx={{ height: 18, fontSize: 10 }}
        />
      </Box>
    ),
  },
  {
    id: "allocation",
    label: "Allocation",
    align: "right",
    render: (row) => `${row.allocation.toFixed(1)}%`,
  },
];

export default function PortfolioClient() {
  return (
    <>
      <PageHeader
        title="Portfolio"
        subtitle="Manage and monitor your positions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Portfolio" }]}
      />
      <DataTable
        columns={columns}
        rows={MOCK_POSITIONS}
        keyField="id"
        pagination
        totalCount={MOCK_POSITIONS.length}
      />
    </>
  );
}
