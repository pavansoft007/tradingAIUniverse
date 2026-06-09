import type { Metadata } from "next";
import Grid from "@mui/material/Grid";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";

export const metadata: Metadata = { title: "Analytics" };

const PERFORMANCE_STATS = [
  { title: "Sharpe Ratio", value: "2.34", icon: null },
  { title: "Max Drawdown", value: "-8.42%", icon: null },
  { title: "Win Rate", value: "67.3%", icon: null },
  { title: "Profit Factor", value: "3.12", icon: null },
];

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Performance metrics and trading insights"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
      />
      <Grid container spacing={2}>
        {PERFORMANCE_STATS.map((stat) => (
          <Grid key={stat.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard title={stat.title} value={stat.value} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
