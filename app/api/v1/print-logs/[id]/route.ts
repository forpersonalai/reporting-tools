import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { getPrintLogs } from "@/lib/dashboard";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["print:read"]);
  if ("response" in authz) return authz.response;

  const { id } = await params;
  const row = (await getPrintLogs()).find((item) => item.id === id);

  if (!row) {
    const response = apiResponse.error("Print log tidak ditemukan", "NOT_FOUND", 404);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }

  const response = apiResponse.success(row);
  attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
  await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
  return response;
}
