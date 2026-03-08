import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { getDashboardStats } from "@/lib/dashboard";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["dashboard:read"]);
  if ("response" in authz) return authz.response;

  const stats = await getDashboardStats();
  const response = apiResponse.success({
    period: { from: "2026-03-01", to: "2026-03-08" },
    summary: {
      totalReports: stats.summary.totalReports,
      totalPrints: stats.summary.todayPrints,
      totalCopies: stats.recentPrints.reduce((sum, row) => sum + row.copies, 0),
      totalPages: stats.summary.totalPages,
      failedPrints: stats.summary.failedPrints,
      activeUsers: stats.summary.activeUsers,
    },
    topReports: stats.topReports,
    byDepartment: stats.byDepartment,
    hourlyTrend: stats.hourlyTrend,
    dailyTrend: [
      { date: "2026-03-05", count: 101 },
      { date: "2026-03-06", count: 116 },
      { date: "2026-03-07", count: 93 },
      { date: "2026-03-08", count: stats.summary.todayPrints },
    ],
  });

  attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
  await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
  return response;
}
