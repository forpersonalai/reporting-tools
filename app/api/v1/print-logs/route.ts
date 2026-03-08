import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { getPrintLogs } from "@/lib/dashboard";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["print:read"]);
  if ("response" in authz) return authz.response;

  const status = req.nextUrl.searchParams.get("status");
  const userId = req.nextUrl.searchParams.get("userId");
  const reportId = req.nextUrl.searchParams.get("reportId");
  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);

  const rows = (await getPrintLogs()).filter((row) => {
    if (status && row.status !== status) return false;
    if (userId && row.user.id !== userId) return false;
    if (reportId && row.report.id !== reportId) return false;
    return true;
  });

  const data = rows.slice((page - 1) * limit, page * limit);
  const response = apiResponse.success(data, { page, limit, total: rows.length });
  attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
  await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
  return response;
}
