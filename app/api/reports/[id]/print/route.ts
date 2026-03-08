import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dispatchWebhook } from "@/lib/webhook";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;

  try {
    const printLog = await prisma.printLog.create({
      data: {
        reportId: id,
        userId: session.user.id,
        copies: Number(body.copies ?? 1),
        printerName: String(body.printerName ?? "Unknown"),
        pageCount: Number(body.pageCount ?? 1),
        status: "SUCCESS",
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        userAgent: req.headers.get("user-agent"),
      },
      include: {
        user: { select: { id: true, name: true, department: true } },
        report: { select: { id: true, title: true, category: true } },
      },
    });

    void dispatchWebhook("print.created", {
      printLogId: printLog.id,
      reportTitle: printLog.report.title,
      userName: printLog.user.name,
      copies: printLog.copies,
      status: printLog.status,
    });

    return NextResponse.json({ success: true, data: printLog }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "DB_UNAVAILABLE", message: "Print log tidak dapat disimpan." } },
      { status: 503 },
    );
  }
}
