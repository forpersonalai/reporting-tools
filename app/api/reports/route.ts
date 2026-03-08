import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getReportList } from "@/lib/dashboard";
import {
  buildReportCreateData,
  ensureSessionUser,
  normalizeReportPayload,
  publishReportPdfForRecord,
} from "@/lib/report-api";

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
  const payload = normalizeReportPayload(body);

  try {
    const created = await prisma.report.create({
      data: buildReportCreateData(payload, createdById ?? session.user.id),
    });

    if (payload.status === "PUBLISHED") {
      const published = await publishReportPdfForRecord(created, session.user.name ?? "Demo Admin");
      return NextResponse.json({ success: true, data: published }, { status: 201 });
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Payload laporan tidak valid." } },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: { code: "DB_UNAVAILABLE", message: "Database belum terhubung." } },
      { status: 503 },
    );
  }
}
