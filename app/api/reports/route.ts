import { NextRequest, NextResponse } from "next/server";
import { ReportFileType, ReportStatus } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getReportList } from "@/lib/dashboard";
import { generateReportPdf } from "@/lib/report-pdf";
import { normalizeWorkflowMetadata } from "@/lib/report-workflow";

async function ensureSessionUser(sessionUser: { id?: string; email?: string | null; name?: string | null; role?: string; department?: string | null }) {
  if (!sessionUser.email) return sessionUser.id ?? null;

  const user = await prisma.user.upsert({
    where: { email: sessionUser.email },
    update: {
      name: sessionUser.name ?? "Demo Admin",
      department: sessionUser.department ?? "IT",
    },
    create: {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name ?? "Demo Admin",
      password: "demo-account",
      role: sessionUser.role === "ADMIN" ? "ADMIN" : sessionUser.role === "MANAGER" ? "MANAGER" : "USER",
      department: sessionUser.department ?? "IT",
    },
    select: { id: true },
  });

  return user.id;
}

export async function GET() {
  const reports = await getReportList();
  return NextResponse.json({ success: true, data: reports, timestamp: new Date().toISOString() });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const createdById = await ensureSessionUser(session.user);
  const status = (body.status as ReportStatus | undefined) ?? "DRAFT";

  try {
    const created = await prisma.report.create({
      data: {
        title: String(body.title ?? ""),
        description: String(body.description ?? ""),
        category: String(body.category ?? "General"),
        fileUrl: body.fileUrl ? String(body.fileUrl) : null,
        fileType: (body.fileType as ReportFileType | undefined) ?? "PDF",
        status,
        tags: JSON.stringify(body.tags ?? []),
        metadata: (body.metadata as object | undefined) ?? undefined,
        createdById: createdById ?? session.user.id,
      },
    });

    if (status === "PUBLISHED") {
      const workflow = normalizeWorkflowMetadata(created.metadata);
      const pdf = await generateReportPdf({
        reportId: created.id,
        title: created.title,
        category: created.category,
        description: created.description ?? "",
        createdByName: session.user.name ?? "Demo Admin",
        workflow,
      });

      const published = await prisma.report.update({
        where: { id: created.id },
        data: {
          fileUrl: pdf.publicUrl,
          fileType: "PDF",
        },
      });

      return NextResponse.json({ success: true, data: published }, { status: 201 });
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "DB_UNAVAILABLE", message: "Database belum terhubung." } },
      { status: 503 },
    );
  }
}
