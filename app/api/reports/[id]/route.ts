import { NextRequest, NextResponse } from "next/server";
import { ReportFileType, ReportStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getReportById } from "@/lib/dashboard";
import { generateReportPdf } from "@/lib/report-pdf";
import { normalizeWorkflowMetadata } from "@/lib/report-workflow";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Report not found" } }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: report, timestamp: new Date().toISOString() });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  try {
    const report = await prisma.report.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        category: typeof body.category === "string" ? body.category : undefined,
        fileUrl: typeof body.fileUrl === "string" ? body.fileUrl || null : undefined,
        fileType: (body.fileType as ReportFileType | undefined) ?? undefined,
        status: (body.status as ReportStatus | undefined) ?? undefined,
        tags: Array.isArray(body.tags) ? JSON.stringify(body.tags) : undefined,
        metadata: typeof body.metadata === "object" ? (body.metadata as object) : undefined,
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (report.status === "PUBLISHED") {
      const workflow = normalizeWorkflowMetadata(report.metadata);
      const pdf = await generateReportPdf({
        reportId: report.id,
        title: report.title,
        category: report.category,
        description: report.description ?? "",
        createdByName: report.createdBy.name,
        workflow,
      });

      const published = await prisma.report.update({
        where: { id: report.id },
        data: {
          fileUrl: pdf.publicUrl,
          fileType: "PDF",
        },
      });

      return NextResponse.json({ success: true, data: published });
    }

    return NextResponse.json({ success: true, data: report });
  } catch {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Report not found" } }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const report = await prisma.report.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    return NextResponse.json({ success: true, data: report });
  } catch {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Report not found" } }, { status: 404 });
  }
}
