import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["users:read"]);
  if ("response" in authz) return authz.response;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, department: true, role: true, createdAt: true },
    });

    if (!user) {
      const response = apiResponse.error("User tidak ditemukan", "NOT_FOUND", 404);
      attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
      await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
      return response;
    }

    const response = apiResponse.success(user);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  } catch {
    const response = apiResponse.error("User tidak ditemukan", "NOT_FOUND", 404);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }
}
