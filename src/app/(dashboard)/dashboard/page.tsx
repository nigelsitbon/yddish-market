import { OverviewContent } from "@/components/dashboard/overview-content";

export const metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <OverviewContent />;
}
