import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["users:read"]);
  if ("response" in authz) return authz.response;

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, department: true, role: true, createdAt: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    const response = apiResponse.success(users);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  } catch {
    const response = apiResponse.success([]);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }
}
