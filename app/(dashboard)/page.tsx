import { AlertTriangle, FileText, Layers3, Printer, Users } from "lucide-react";

import { AISummaryPanel } from "@/components/dashboard/AISummaryPanel";
import { PrintActivityChart } from "@/components/dashboard/PrintActivityChart";
import { RecentPrintTable } from "@/components/dashboard/RecentPrintTable";
import { RealtimeFeed } from "@/components/dashboard/RealtimeFeed";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getDashboardStats } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const topReport = stats.topReports[0];
  const topDepartment = [...stats.byDepartment].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="overflow-hidden rounded-[34px] border border-black/10 bg-[linear-gradient(180deg,#27211d_0%,#171311_100%)] px-6 py-7 text-white shadow-[0_28px_64px_rgba(17,12,9,0.26)] md:px-8">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/56">Operational overview</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">Monitoring cetak dan laporan kini lebih terang, lebih fokus, dan lebih mudah dipahami.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              Tampilan dashboard dibangun ulang agar user langsung melihat angka penting, tren jam sibuk, dan daftar aktivitas tanpa harus berpindah-pindah halaman.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
              <p className="text-sm text-white/56">Top report</p>
              <p className="mt-2 text-xl font-semibold">{topReport?.title ?? "Belum ada data"}</p>
              <p className="mt-2 text-sm text-white/64">{topReport ? `${topReport.printCount} kali dicetak hari ini` : "Menunggu aktivitas"}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
              <p className="text-sm text-white/56">Departemen teraktif</p>
              <p className="mt-2 text-xl font-semibold">{topDepartment?.name ?? "Belum ada data"}</p>
              <p className="mt-2 text-sm text-white/64">{topDepartment ? `${topDepartment.value} aktivitas print` : "Belum ada aktivitas"}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
              <p className="text-sm text-white/56">Alert gagal print</p>
              <p className="mt-2 text-xl font-semibold">{stats.summary.failedPrints}</p>
              <p className="mt-2 text-sm text-white/64">Perlu tindak lanjut cepat dari tim operasional</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[30px] border border-border/80 bg-[rgba(255,252,246,0.9)] p-6 shadow-[0_24px_60px_rgba(43,37,30,0.08)] backdrop-blur-xl dark:bg-[rgba(31,26,23,0.88)]">
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Quick action</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Status sistem hari ini</h2>
            <div className="mt-6 space-y-3">
              <div className="flex items-start justify-between rounded-[20px] border border-border bg-background/72 px-4 py-4">
                <div>
                  <p className="font-medium">Kinerja print</p>
                  <p className="mt-1 text-sm text-muted-foreground">Volume cetak bergerak normal.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/16 dark:text-emerald-200">Stabil</span>
              </div>
              <div className="flex items-start justify-between rounded-[20px] border border-border bg-background/72 px-4 py-4">
                <div>
                  <p className="font-medium">Antrian AI summary</p>
                  <p className="mt-1 text-sm text-muted-foreground">Insight dapat di-generate dari panel dashboard.</p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Ready</span>
              </div>
              <div className="flex items-start justify-between rounded-[20px] border border-border bg-background/72 px-4 py-4">
                <div>
                  <p className="font-medium">Insiden perlu review</p>
                  <p className="mt-1 text-sm text-muted-foreground">Fokus pada job gagal dan printer bermasalah.</p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-500/16 dark:text-rose-200">
                  {stats.summary.failedPrints} issue
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Laporan"
          value={stats.summary.totalReports}
          delta={stats.summary.reportsChange}
          hint="vs kemarin"
          icon={FileText}
          accentClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/16 dark:text-blue-200"
        />
        <StatsCard
          title="Print Hari Ini"
          value={stats.summary.todayPrints}
          delta={stats.summary.todayPrintChange}
          hint="vs kemarin"
          icon={Printer}
          accentClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/16 dark:text-emerald-200"
        />
        <StatsCard
          title="Total Halaman"
          value={stats.summary.totalPages}
          delta={stats.summary.pagesChange}
          hint="halaman tercetak hari ini"
          icon={Layers3}
          accentClassName="bg-amber-100 text-amber-700 dark:bg-amber-500/16 dark:text-amber-200"
        />
        <StatsCard
          title="User Aktif"
          value={stats.summary.activeUsers}
          hint={stats.summary.activeUsersChangeLabel}
          icon={Users}
          accentClassName="bg-violet-100 text-violet-700 dark:bg-violet-500/16 dark:text-violet-200"
        />
      </section>

      <PrintActivityChart stats={stats} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <RecentPrintTable rows={stats.recentPrints} />
        <div className="space-y-6">
          <div className="rounded-[30px] border border-border/80 bg-[rgba(255,252,246,0.9)] p-6 shadow-[0_24px_60px_rgba(43,37,30,0.08)] backdrop-blur-xl dark:bg-[rgba(31,26,23,0.88)]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
              <AlertTriangle className="h-3.5 w-3.5" />
              Watchlist
            </div>
            <h2 className="mt-3 text-xl font-semibold">Area yang perlu perhatian</h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-[20px] border border-border bg-background/72 p-4">
                <p className="font-medium">Gagal print</p>
                <p className="mt-1 text-sm text-muted-foreground">{stats.summary.failedPrints} kejadian tercatat hari ini.</p>
              </div>
              <div className="rounded-[20px] border border-border bg-background/72 p-4">
                <p className="font-medium">Top report</p>
                <p className="mt-1 text-sm text-muted-foreground">{topReport?.title ?? "Belum ada laporan dominan"} {topReport ? `mendominasi ${topReport.printCount} cetakan.` : ""}</p>
              </div>
              <div className="rounded-[20px] border border-border bg-background/72 p-4">
                <p className="font-medium">User aktif</p>
                <p className="mt-1 text-sm text-muted-foreground">{stats.summary.activeUsers} user aktif terpantau di dashboard saat ini.</p>
              </div>
            </div>
          </div>
          <RealtimeFeed />
          <AISummaryPanel />
        </div>
      </section>
    </div>
  );
}
