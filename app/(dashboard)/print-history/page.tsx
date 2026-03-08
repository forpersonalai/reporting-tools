import { RecentPrintTable } from "@/components/dashboard/RecentPrintTable";
import { getPrintLogs } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function PrintHistoryPage() {
  const rows = await getPrintLogs();

  return <RecentPrintTable rows={rows} />;
}
