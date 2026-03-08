import { NextRequest } from "next/server";
import { ReportStatus } from "@prisma/client";

import { apiResponse } from "@/lib/api-middleware";
import { getPrintLogs, getReportList } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["reports:read"]);
  if ("response" in authz) return authz.response;

  const { id } = await params;
  const report = (await getReportList()).find((item) => item.id === id);

  if (!report) {
    const response = apiResponse.error("Report dengan ID tersebut tidak ditemukan", "NOT_FOUND", 404);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }

  const relatedPrints = (await getPrintLogs()).filter((row) => row.report.id === id);
  const data = {
    ...report,
    printStats: {
      totalPrints: relatedPrints.length,
      totalCopies: relatedPrints.reduce((sum, row) => sum + row.copies, 0),
      totalPages: relatedPrints.reduce((sum, row) => sum + row.pageCount, 0),
      lastPrintedAt: relatedPrints[0]?.printedAt ?? null,
      uniqueUsers: new Set(relatedPrints.map((row) => row.user.id)).size,
    },
    recentPrints: relatedPrints.slice(0, 10),
  };

  const response = apiResponse.success(data);
  attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
  await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
  return response;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["reports:write"]);
  if ("response" in authz) return authz.response;

  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  try {
    const updated = await prisma.report.update({
      where: { id },
      data: {
        title: body.title ? String(body.title) : undefined,
        description: body.description ? String(body.description) : undefined,
        category: body.category ? String(body.category) : undefined,
        status: (body.status as ReportStatus | undefined) ?? undefined,
      },
    });

    const response = apiResponse.success(updated);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  } catch {
    const response = apiResponse.error("Report dengan ID tersebut tidak ditemukan", "NOT_FOUND", 404);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return PUT(req, ctx);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["reports:write"]);
  if ("response" in authz) return authz.response;

  const { id } = await params;

  try {
    const archived = await prisma.report.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    const response = apiResponse.success(archived);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  } catch {
    const response = apiResponse.error("Report dengan ID tersebut tidak ditemukan", "NOT_FOUND", 404);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }
}
