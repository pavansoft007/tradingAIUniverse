import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <PageHeader
      title="Alerts"
      subtitle="Manage your price alerts and notifications"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Alerts" }]}
    />
  );
}
