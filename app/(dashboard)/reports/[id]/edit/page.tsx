import { notFound } from "next/navigation";

import { ReportForm } from "@/components/reports/ReportForm";
import { getReportById } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) notFound();

  return <ReportForm mode="edit" report={report} />;
}
