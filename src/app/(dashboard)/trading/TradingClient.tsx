"use client";

import Grid from "@mui/material/Grid";
import { OrderForm } from "@/components/features/trading/OrderForm";
import { PageHeader } from "@/components/common/PageHeader";
import { useTradingStore } from "@/store/useTradingStore";
import { useTicker } from "@/hooks/useMarketData";

export default function TradingClient() {
  const { selectedSymbol } = useTradingStore();
  const { data } = useTicker(selectedSymbol);
  const ticker = data?.data;

  return (
    <>
      <PageHeader
        title="Trading"
        subtitle="Place orders and manage your positions"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Trading" }]}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <OrderForm symbol={selectedSymbol} currentPrice={ticker?.price} />
        </Grid>
      </Grid>
    </>
  );
}
