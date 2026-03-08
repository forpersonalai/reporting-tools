import { notFound } from "next/navigation";
import Link from "next/link";

import { ArchiveReportButton } from "@/components/reports/ArchiveReportButton";
import { PrintButton } from "@/components/reports/PrintButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReportById } from "@/lib/dashboard";
import { getReportDataSource } from "@/lib/report-data-sources";
import { getFieldLabel, normalizeWorkflowMetadata } from "@/lib/report-workflow";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) notFound();

  const workflow = normalizeWorkflowMetadata(report.metadata);
  const source = getReportDataSource(workflow.sourceName);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{report.title}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>
            <div className="mt-3 flex gap-2">
              <Badge>{report.category}</Badge>
              <Badge>{report.status}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button asChild variant="outline">
              <Link href={`/reports/${report.id}/edit`}>Edit laporan</Link>
            </Button>
            {report.fileUrl?.startsWith("/generated-reports/") ? (
              <Button asChild variant="secondary">
                <Link href={report.fileUrl} target="_blank">
                  Buka PDF
                </Link>
              </Button>
            ) : null}
            <ArchiveReportButton reportId={report.id} />
            <PrintButton reportId={report.id} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">File Type</p>
            <p className="mt-1 font-semibold">{report.fileType}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Print Count</p>
            <p className="mt-1 font-semibold">{report.printCount}x</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Created By</p>
            <p className="mt-1 font-semibold">{report.createdBy.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">File URL</p>
            <p className="mt-1 break-all font-semibold">{report.fileUrl || "-"}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Workflow PDF</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Data Source</p>
            <p className="mt-1 font-semibold">{source.label} ({source.tableName})</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Output</p>
            <p className="mt-1 font-semibold">{workflow.outputName}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Filter Rule</p>
            <p className="mt-1 font-semibold">{workflow.filterRule}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Summary Logic</p>
            <p className="mt-1 font-semibold">{workflow.summaryFocus}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Selected Fields</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {workflow.selectedFields.map((field) => (
                <Badge key={field} variant="secondary">
                  {getFieldLabel(workflow.sourceName, field)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
