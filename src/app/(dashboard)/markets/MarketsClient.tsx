"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { MarketWatchTable } from "@/components/features/market/MarketWatchTable";
import { LiveTicker } from "@/components/features/market/LiveTicker";
import { PageHeader } from "@/components/common/PageHeader";
import { EXCHANGE_TYPE, WS_MODE } from "@/types/smartws.types";

const SPOTLIGHT = [
  { symbol: "RELIANCE",  token: "2885",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "TCS",       token: "11536", exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "HDFCBANK",  token: "1333",  exchangeType: EXCHANGE_TYPE.NSE_CM },
  { symbol: "INFY",      token: "1594",  exchangeType: EXCHANGE_TYPE.NSE_CM },
];

export default function MarketsClient() {
  return (
    <>
      <PageHeader
        title="Markets"
        subtitle="Real-time streaming via Angel One SmartAPI"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Markets" }]}
      />

      {/* Spotlight tickers */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {SPOTLIGHT.map((item) => (
          <Grid key={item.token} size={{ xs: 6, sm: 3 }}>
            <LiveTicker
              symbol={item.symbol}
              token={item.token}
              exchangeType={item.exchangeType}
              mode={WS_MODE.QUOTE}
            />
          </Grid>
        ))}
      </Grid>

      {/* Full market watch */}
      <Box>
        <MarketWatchTable />
      </Box>
    </>
  );
}
