"use client";

import { useState } from "react";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import Box        from "@mui/material/Box";
import Card       from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip       from "@mui/material/Chip";
import Divider    from "@mui/material/Divider";
import Grid       from "@mui/material/Grid";
import Tab        from "@mui/material/Tab";
import Tabs       from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";

import { OrderPanel }         from "@/components/features/trading/OrderPanel";
import { OrderBook }          from "@/components/features/trading/OrderBook";
import { TradeBook }          from "@/components/features/trading/TradeBook";
import { LivePositionsTable } from "@/components/features/portfolio/LivePositionsTable";
import { PageHeader }         from "@/components/common/PageHeader";
import { useTradingStore }    from "@/store/useTradingStore";
import { useTicker }          from "@/hooks/useMarketData";

// ── Market depth (bids/asks visualization) ────────────────────────────────────

function generateDepth(ltp: number) {
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price:  +(ltp - (i + 1) * 0.5).toFixed(2),
    qty:    Math.floor(Math.random() * 8_000 + 500),
    orders: Math.floor(Math.random() * 20 + 1),
  }));
  const asks = Array.from({ length: 5 }, (_, i) => ({
    price:  +(ltp + (i + 1) * 0.5).toFixed(2),
    qty:    Math.floor(Math.random() * 8_000 + 500),
    orders: Math.floor(Math.random() * 20 + 1),
  }));
  return { bids, asks };
}

function MarketDepth({ ltp }: { ltp: number }) {
  const theme = useTheme();
  const { bids, asks } = generateDepth(ltp || 2_500);
  const maxQty = Math.max(...bids.map((b) => b.qty), ...asks.map((a) => a.qty));

  const Row = ({
    price, qty, orders, side,
  }: { price: number; qty: number; orders: number; side: "bid" | "ask" }) => {
    const color = side === "bid" ? theme.palette.success.main : theme.palette.error.main;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.4, position: "relative" }}>
        <Box sx={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: `${(qty / maxQty) * 100}%`,
          background: alpha(color, 0.06),
          borderRadius: "3px",
        }} />
        <Typography sx={{ fontSize: 12, color, fontFeatureSettings: '"tnum"', flex: 1, fontWeight: 500 }}>
          {price.toFixed(2)}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", fontFeatureSettings: '"tnum"', textAlign: "right", minWidth: 70 }}>
          {qty.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "text.disabled", textAlign: "right", minWidth: 24 }}>
          {orders}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {[...asks].reverse().map((a) => <Row key={a.price} {...a} side="ask" />)}

      <Box sx={{
        display: "flex", alignItems: "center", justifyContent: "center",
        py: 0.75, my: 0.5,
        borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider",
        background: alpha(theme.palette.primary.main, 0.06), borderRadius: "6px",
      }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: "primary.main", fontFeatureSettings: '"tnum"' }}>
          ₹{ltp?.toFixed(2) ?? "—"}
        </Typography>
      </Box>

      {bids.map((b) => <Row key={b.price} {...b} side="bid" />)}

      <Box sx={{ display: "flex", gap: 1, pt: 1, mt: 0.5, borderTop: "1px solid", borderColor: "divider" }}>
        {["Price", "Qty", "Ord"].map((h) => (
          <Typography key={h} sx={{ fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.04em", flex: h === "Price" ? 1 : undefined, textAlign: h !== "Price" ? "right" : undefined, minWidth: h === "Qty" ? 70 : h === "Ord" ? 24 : undefined }}>
            {h}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TradingClient() {
  const theme = useTheme();
  const { selectedSymbol } = useTradingStore();
  const { data } = useTicker(selectedSymbol);
  const ticker   = data?.data;
  const ltp      = ticker?.price ?? 2_710;
  const change   = 34.5;
  const changePct = 1.29;
  const isUp     = change >= 0;
  const changeColor = isUp ? theme.palette.success.main : theme.palette.error.main;

  const [tab, setTab] = useState(0);

  return (
    <>
      <PageHeader
        title="Trading"
        subtitle="Place orders and manage your positions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Trading" }]}
      />

      {/* Symbol strip */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: "14px !important", px: "20px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.02em" }}>
                {selectedSymbol || "RELIANCE"}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>NSE · Equity</Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>
              ₹{ltp.toLocaleString("en-IN")}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              {isUp
                ? <TrendingUpIcon   sx={{ fontSize: 18, color: changeColor }} />
                : <TrendingDownIcon sx={{ fontSize: 18, color: changeColor }} />}
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: changeColor, fontFeatureSettings: '"tnum"' }}>
                {isUp ? "+" : ""}₹{Math.abs(change).toFixed(2)}
              </Typography>
              <Chip
                label={`${isUp ? "+" : ""}${changePct.toFixed(2)}%`}
                size="small"
                sx={{ height: 22, fontSize: 11.5, fontWeight: 700, background: alpha(changeColor, 0.12), color: changeColor, border: `1px solid ${alpha(changeColor, 0.25)}` }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 3, ml: "auto" }}>
              {[
                { label: "Open", value: "2,684.20" },
                { label: "High", value: "2,722.50" },
                { label: "Low",  value: "2,678.90" },
                { label: "Vol",  value: "4.2M" },
              ].map((item) => (
                <Box key={item.label} sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: 10.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Order Panel (left) */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: 580, display: "flex", flexDirection: "column" }}>
            <OrderPanel
              symbol={selectedSymbol || "RELIANCE-EQ"}
              symboltoken="2885"
              exchange="NSE"
              ltp={ltp}
            />
          </Card>
        </Grid>

        {/* Market Depth (center-left) */}
        <Grid size={{ xs: 12, md: 2 }}>
          <Card sx={{ height: 580 }}>
            <CardContent sx={{ p: "16px !important" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>Market Depth</Typography>
              <MarketDepth ltp={ltp} />
            </CardContent>
          </Card>
        </Grid>

        {/* Order Book / Trade Book / Positions (right) */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: 580, display: "flex", flexDirection: "column" }}>
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  minHeight: 44,
                  px: 1,
                  "& .MuiTab-root": { minHeight: 44, fontSize: 13, fontWeight: 600, textTransform: "none" },
                }}
              >
                <Tab label="Order Book" />
                <Tab label="Trade Book" />
                <Tab label="Positions" />
              </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {tab === 0 && <OrderBook />}
              {tab === 1 && <TradeBook />}
              {tab === 2 && <LivePositionsTable />}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
