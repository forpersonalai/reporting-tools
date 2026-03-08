import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/db";
import { getReportById } from "@/lib/dashboard";
import {
  buildReportUpdateData,
  normalizeReportPayload,
  publishReportPdfForRecord,
} from "@/lib/report-api";

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
  const payload = normalizeReportPayload(body);

  try {
    const report = await prisma.report.update({
      where: { id },
      data: buildReportUpdateData(payload),
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (payload.status === "PUBLISHED") {
      const published = await publishReportPdfForRecord(report, report.createdBy.name);
      return NextResponse.json({ success: true, data: published });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Payload laporan tidak valid." } },
        { status: 400 },
      );
    }

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
