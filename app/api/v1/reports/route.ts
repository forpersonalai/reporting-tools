import { ReportFileType, ReportStatus } from "@prisma/client";
import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { getReportList } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["reports:read"]);
  if ("response" in authz) return authz.response;

  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 100);
  const category = req.nextUrl.searchParams.get("category");
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search")?.toLowerCase();

  const rows = await getReportList();
  const filtered = rows.filter((report) => {
    if (category && report.category !== category) return false;
    if (status && report.status !== status) return false;
    if (search && !report.title.toLowerCase().includes(search)) return false;
    return true;
  });

  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  const response = apiResponse.success(data, {
    page,
    limit,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / limit),
    hasNextPage: start + limit < filtered.length,
    hasPrevPage: page > 1,
  });

  attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
  await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
  return response;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["reports:write"]);
  if ("response" in authz) return authz.response;

  const body = (await req.json()) as Record<string, unknown>;

  try {
    const created = await prisma.report.create({
      data: {
        title: String(body.title ?? ""),
        description: body.description ? String(body.description) : null,
        category: String(body.category ?? "General"),
        fileType: (body.fileType as ReportFileType | undefined) ?? "PDF",
        fileUrl: body.fileUrl ? String(body.fileUrl) : null,
        status: (body.status as ReportStatus | undefined) ?? "DRAFT",
        tags: JSON.stringify(body.tags ?? []),
        metadata: (body.metadata as object | undefined) ?? undefined,
        createdById: authz.userId,
      },
      select: { id: true, title: true, status: true, createdAt: true },
    });

    const response = apiResponse.success(created, undefined, 201);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  } catch {
    const response = apiResponse.error("Database belum terhubung", "INTERNAL_ERROR", 500);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }
}
