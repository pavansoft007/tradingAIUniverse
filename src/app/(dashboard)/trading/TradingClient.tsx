"use client";

import { useMemo, useState }  from "react";
import TrendingDownIcon       from "@mui/icons-material/TrendingDown";
import TrendingUpIcon         from "@mui/icons-material/TrendingUp";
import Box                   from "@mui/material/Box";
import Card                  from "@mui/material/Card";
import CardContent            from "@mui/material/CardContent";
import Chip                  from "@mui/material/Chip";
import CircularProgress       from "@mui/material/CircularProgress";
import Divider                from "@mui/material/Divider";
import Grid                  from "@mui/material/Grid";
import Tab                   from "@mui/material/Tab";
import Tabs                  from "@mui/material/Tabs";
import Typography            from "@mui/material/Typography";
import { alpha, useTheme }   from "@mui/material/styles";

import { OrderPanel }         from "@/components/features/trading/OrderPanel";
import { OrderBook }          from "@/components/features/trading/OrderBook";
import { TradeBook }          from "@/components/features/trading/TradeBook";
import { PositionsPanel }     from "@/components/features/trading/PositionsPanel";
import { GTTPanel }           from "@/components/features/trading/GTTPanel";
import { RiskGauge }          from "@/components/features/trading/RiskGauge";
import { LivePositionsTable } from "@/components/features/portfolio/LivePositionsTable";
import { PageHeader }         from "@/components/common/PageHeader";
import { useTradingStore }    from "@/store/useTradingStore";
import { useMarketQuote }     from "@/hooks/useMarketQuote";
import type { AngelDepthLevel } from "@/types/angel-portfolio.types";

// ── Default config ────────────────────────────────────────────────────────────

const DEFAULT_TOKEN    = "2885";   // RELIANCE
const DEFAULT_EXCHANGE = "NSE";

// ── Market Depth ──────────────────────────────────────────────────────────────

interface MarketDepthProps {
  ltp:      number;
  bids?:    AngelDepthLevel[];
  asks?:    AngelDepthLevel[];
  loading?: boolean;
}

function MarketDepth({ ltp, bids = [], asks = [], loading }: MarketDepthProps) {
  const theme  = useTheme();
  const maxQty = useMemo(
    () => Math.max(...bids.map((b) => b.quantity), ...asks.map((a) => a.quantity), 1),
    [bids, asks],
  );

  const Row = ({ price, quantity, orders, side }: AngelDepthLevel & { side: "bid" | "ask" }) => {
    const color = side === "bid" ? theme.palette.success.main : theme.palette.error.main;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.4, position: "relative" }}>
        <Box sx={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: `${(quantity / maxQty) * 100}%`,
          background: alpha(color, 0.06), borderRadius: "3px",
        }} />
        <Typography sx={{ fontSize: 12, color, fontFeatureSettings: '"tnum"', flex: 1, fontWeight: 500 }}>
          {price.toFixed(2)}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", fontFeatureSettings: '"tnum"', textAlign: "right", minWidth: 70 }}>
          {quantity.toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "text.disabled", textAlign: "right", minWidth: 24 }}>
          {orders}
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>;
  }

  return (
    <Box>
      {[...asks].reverse().map((a, i) => <Row key={i} {...a} side="ask" />)}

      <Box sx={{
        display: "flex", alignItems: "center", justifyContent: "center",
        py: 0.75, my: 0.5,
        borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider",
        background: alpha(theme.palette.primary.main, 0.06), borderRadius: "6px",
      }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: "primary.main", fontFeatureSettings: '"tnum"' }}>
          ₹{ltp.toFixed(2)}
        </Typography>
      </Box>

      {bids.map((b, i) => <Row key={i} {...b} side="bid" />)}

      {!bids.length && !asks.length && (
        <Typography sx={{ fontSize: 12, color: "text.secondary", textAlign: "center", py: 2 }}>
          Log in to see live depth
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1, pt: 1, mt: 0.5, borderTop: "1px solid", borderColor: "divider" }}>
        {["Price", "Qty", "Ord"].map((h) => (
          <Typography key={h} sx={{
            fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.04em",
            flex: h === "Price" ? 1 : undefined,
            textAlign: h !== "Price" ? "right" : undefined,
            minWidth: h === "Qty" ? 70 : h === "Ord" ? 24 : undefined,
          }}>
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
  const [tab, setTab] = useState(0);

  const symbolToken = DEFAULT_TOKEN;
  const exchange    = DEFAULT_EXCHANGE;

  const { quote, isLoading: quoteLoading } = useMarketQuote(symbolToken, exchange);

  const ltp       = quote?.ltp       ?? 0;
  const open      = quote?.open      ?? 0;
  const high      = quote?.high      ?? 0;
  const low       = quote?.low       ?? 0;
  const prevClose = quote?.close     ?? 0;
  const volume    = quote?.volume    ?? 0;
  const change    = prevClose > 0 ? ltp - prevClose : 0;
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
  const isUp      = change >= 0;
  const changeColor = isUp ? theme.palette.success.main : theme.palette.error.main;

  const displaySymbol = selectedSymbol || "RELIANCE";

  const fmtVol = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000   ? `${(v / 1_000).toFixed(0)}K`
    : v.toString();

  return (
    <>
      <PageHeader
        title="Trading"
        subtitle="Place orders and manage your positions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Trading" }]}
      />

      {/* Risk gauge row */}
      <Box sx={{ mb: 2 }}>
        <RiskGauge />
      </Box>

      {/* Symbol strip */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: "14px !important", px: "20px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.02em" }}>
                {displaySymbol}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{exchange} · Equity</Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {quoteLoading && ltp === 0 ? (
              <CircularProgress size={20} />
            ) : (
              <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>
                ₹{ltp > 0 ? ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
              </Typography>
            )}

            {ltp > 0 && (
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
                  sx={{
                    height: 22, fontSize: 11.5, fontWeight: 700,
                    background: alpha(changeColor, 0.12),
                    color: changeColor,
                    border: `1px solid ${alpha(changeColor, 0.25)}`,
                  }}
                />
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 3, ml: "auto" }}>
              {[
                { label: "Open",  value: open  > 0 ? open.toLocaleString("en-IN")  : "—" },
                { label: "High",  value: high  > 0 ? high.toLocaleString("en-IN")  : "—" },
                { label: "Low",   value: low   > 0 ? low.toLocaleString("en-IN")   : "—" },
                { label: "Vol",   value: volume > 0 ? fmtVol(volume)               : "—" },
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
        {/* Order Panel */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: 580, display: "flex", flexDirection: "column" }}>
            <OrderPanel
              symbol={`${displaySymbol}-EQ`}
              symboltoken={symbolToken}
              exchange={exchange}
              ltp={ltp}
            />
          </Card>
        </Grid>

        {/* Market Depth */}
        <Grid size={{ xs: 12, md: 2 }}>
          <Card sx={{ height: 580 }}>
            <CardContent sx={{ p: "16px !important" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>Market Depth</Typography>
              <MarketDepth
                ltp={ltp}
                bids={quote?.depth?.buy  ?? []}
                asks={quote?.depth?.sell ?? []}
                loading={quoteLoading && !quote}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Order Book / Trade Book / Positions / Holdings */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: 580, display: "flex", flexDirection: "column" }}>
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  minHeight: 44, px: 1,
                  "& .MuiTab-root": { minHeight: 44, fontSize: 13, fontWeight: 600, textTransform: "none" },
                }}
              >
                <Tab label="Order Book" />
                <Tab label="Trade Book" />
                <Tab label="Positions" />
                <Tab label="Holdings" />
                <Tab label="GTT Orders" />
              </Tabs>
            </Box>
            <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {tab === 0 && <OrderBook />}
              {tab === 1 && <TradeBook />}
              {tab === 2 && <PositionsPanel />}
              {tab === 3 && <LivePositionsTable />}
              {tab === 4 && <GTTPanel />}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
