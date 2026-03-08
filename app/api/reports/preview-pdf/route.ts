import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { buildReportPdfBytes } from "@/lib/report-pdf";
import { buildOutputFileName, normalizeWorkflowMetadata } from "@/lib/report-workflow";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const body = (await req.json()) as {
    title?: string;
    category?: string;
    description?: string;
    metadata?: unknown;
  };

  const workflow = normalizeWorkflowMetadata(body.metadata);
  const fileName = workflow.outputName || buildOutputFileName(String(body.title ?? "Preview Report"), workflow.parameters);
  const pdfBytes = await buildReportPdfBytes({
    reportId: "preview",
    title: String(body.title ?? "Preview Report"),
    category: String(body.category ?? "General"),
    description: String(body.description ?? ""),
    createdByName: session.user.name ?? "Demo Admin",
    workflow,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
