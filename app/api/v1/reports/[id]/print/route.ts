import { NextRequest } from "next/server";
import { PrintStatus } from "@prisma/client";

import { apiResponse } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";
import { dispatchWebhook } from "@/lib/webhook";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["print:write"]);
  if ("response" in authz) return authz.response;

  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  try {
    const created = await prisma.printLog.create({
      data: {
        reportId: id,
        userId: authz.userId,
        copies: Number(body.copies ?? 1),
        pageCount: Number(body.pageCount ?? 1),
        printerName: body.printerName ? String(body.printerName) : null,
        status: (body.status as PrintStatus | undefined) ?? "SUCCESS",
        duration: body.duration ? Number(body.duration) : null,
        notes: body.notes ? String(body.notes) : null,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      },
    });

    void dispatchWebhook(created.status === "FAILED" ? "print.failed" : "print.created", {
      printLogId: created.id,
      reportId: created.reportId,
      status: created.status,
      copies: created.copies,
    });

    const response = apiResponse.success(created, undefined, 201);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  } catch {
    const response = apiResponse.error("Gagal membuat print log", "INTERNAL_ERROR", 500);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }
}
