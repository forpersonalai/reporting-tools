import Link from "next/link";

import { ReportTable } from "@/components/reports/ReportTable";
import { Button } from "@/components/ui/button";
import { getReportList } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await getReportList();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Reports</p>
          <h1 className="mt-2 text-3xl font-semibold">Kelola semua laporan terpusat</h1>
        </div>
        <Link href="/reports/create">
          <Button>Buat laporan</Button>
        </Link>
      </div>
      <ReportTable reports={reports} />
    </div>
  );
}
