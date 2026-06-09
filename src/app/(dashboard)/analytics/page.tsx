import type { Metadata } from "next";
import Grid from "@mui/material/Grid";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { PerformanceChart } from "@/components/features/analytics/PerformanceChart";
import { MonthlyPnLChart } from "@/components/features/analytics/MonthlyPnLChart";

export const metadata: Metadata = { title: "Analytics" };

const PERFORMANCE_STATS = [
  { title: "Sharpe Ratio",   value: "2.34",  iconColor: "#6366F1" },
  { title: "Max Drawdown",   value: "-8.42%", iconColor: "#F23645" },
  { title: "Win Rate",       value: "67.3%",  iconColor: "#00D97E" },
  { title: "Profit Factor",  value: "3.12",   iconColor: "#38BDF8" },
];

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Performance metrics and trading insights"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
      />

      {/* KPI strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {PERFORMANCE_STATS.map((stat) => (
          <Grid key={stat.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title={stat.title} value={stat.value} iconColor={stat.iconColor} />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <PerformanceChart />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <MonthlyPnLChart />
        </Grid>
      </Grid>
    </>
  );
}
