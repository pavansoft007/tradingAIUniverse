"use client";

import Box              from "@mui/material/Box";
import Tab              from "@mui/material/Tab";
import Tabs             from "@mui/material/Tabs";
import Typography       from "@mui/material/Typography";
import { useState }     from "react";
import { WalletCard }   from "@/components/features/paper-trading/WalletCard";
import { PaperOrderEntryForm }  from "@/components/features/paper-trading/PaperOrderEntryForm";
import { PaperPositionsTable }  from "@/components/features/paper-trading/PaperPositionsTable";
import { PaperOrderBook }       from "@/components/features/paper-trading/PaperOrderBook";
import { PaperTradeJournal }    from "@/components/features/paper-trading/PaperTradeJournal";
import { TradingStatsCard }     from "@/components/features/paper-trading/TradingStatsCard";

export function PaperTradingClient() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Paper Trading Simulator
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Practice trading with ₹10 lakh virtual balance · Zero real risk · Live market prices
        </Typography>
      </Box>

      {/* Wallet + Stats always visible */}
      <WalletCard />
      <TradingStatsCard />

      {/* Main layout: order form | content tabs */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "340px 1fr" }, gap: 3 }}>
        {/* Left: Order Entry */}
        <Box>
          <PaperOrderEntryForm />
        </Box>

        {/* Right: Tabbed content */}
        <Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} textColor="primary" indicatorColor="primary">
            <Tab label="Positions" />
            <Tab label="Order Book" />
            <Tab label="Trade Journal" />
          </Tabs>

          {tab === 0 && <PaperPositionsTable />}
          {tab === 1 && <PaperOrderBook />}
          {tab === 2 && <PaperTradeJournal />}
        </Box>
      </Box>
    </Box>
  );
}
