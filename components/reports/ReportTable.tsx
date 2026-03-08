import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportListItem } from "@/types";

export function ReportTable({ reports }: { reports: ReportListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar laporan</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="pb-3">Judul</th>
              <th className="pb-3">Kategori</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Print</th>
              <th className="pb-3">Pembuat</th>
              <th className="pb-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-border/80">
                <td className="py-4">
                  <Link href={`/reports/${report.id}`} className="font-semibold transition hover:text-primary">
                    {report.title}
                  </Link>
                </td>
                <td className="py-4">{report.category}</td>
                <td className="py-4">
                  <Badge>{report.status}</Badge>
                </td>
                <td className="py-4">{report.printCount}x</td>
                <td className="py-4">{report.createdBy.name}</td>
                <td className="py-4">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/reports/${report.id}`}>Detail</Link>
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/reports/${report.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
