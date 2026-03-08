import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { buildPreviewPdfFile, normalizeReportPayload } from "@/lib/report-api";

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
  try {
    const payload = normalizeReportPayload(body as Record<string, unknown>);
    const { fileName, pdfBytes } = await buildPreviewPdfFile(payload, session.user.name ?? "Demo Admin");

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Payload preview tidak valid." } },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: { code: "PDF_PREVIEW_FAILED", message: "Gagal membuat preview PDF." } },
      { status: 500 },
    );
  }
}
