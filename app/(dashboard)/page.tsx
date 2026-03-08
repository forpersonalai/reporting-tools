import { AISummaryPanel } from "@/components/dashboard/AISummaryPanel";
import { PrintActivityChart } from "@/components/dashboard/PrintActivityChart";
import { RecentPrintTable } from "@/components/dashboard/RecentPrintTable";
import { RealtimeFeed } from "@/components/dashboard/RealtimeFeed";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getDashboardStats } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-5">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Laporan" value={stats.summary.totalReports} delta={stats.summary.reportsChange} hint="vs kemarin" />
        <StatsCard title="Print Hari Ini" value={stats.summary.todayPrints} delta={stats.summary.todayPrintChange} hint="vs kemarin" />
        <StatsCard title="Total Halaman" value={stats.summary.totalPages} delta={stats.summary.pagesChange} hint="halaman tercetak hari ini" />
        <StatsCard title="User Aktif" value={stats.summary.activeUsers} hint={stats.summary.activeUsersChangeLabel} />
      </section>

      <PrintActivityChart stats={stats} />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <RecentPrintTable rows={stats.recentPrints} />
        <RealtimeFeed />
      </section>

      <AISummaryPanel />
    </div>
  );
}
