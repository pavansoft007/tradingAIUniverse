import { RouteGuard } from "@/components/features/auth/RouteGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </RouteGuard>
  );
}
