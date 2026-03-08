import { NextRequest, NextResponse } from "next/server";

import { apiResponse, type ApiScope, validateApiKey } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function authorizeRequest(req: NextRequest, scopes: ApiScope[]) {
  const validation = await validateApiKey(req, scopes);
  if (!validation.success) {
    return { response: apiResponse.error(validation.error, validation.code, validation.status) };
  }

  const limiter = rateLimit(validation.apiKeyId, validation.rateLimit);
  if (!limiter.success) {
    const response = apiResponse.error("Terlalu banyak request", "RATE_LIMIT_EXCEEDED", 429);
    attachRateLimitHeaders(response, limiter.limit, limiter.remaining, limiter.reset);
    return { response };
  }

  return {
    userId: validation.userId,
    apiKeyId: validation.apiKeyId,
    rateLimit: limiter,
  };
}

export async function logApiUsage(req: NextRequest, apiKeyId: string, statusCode: number, startedAt: number) {
  try {
    await prisma.apiKeyUsage.create({
      data: {
        apiKeyId,
        endpoint: req.nextUrl.pathname,
        method: req.method,
        statusCode,
        duration: Date.now() - startedAt,
        ip: req.headers.get("x-forwarded-for") ?? "unknown",
      },
    });
  } catch {
    // Ignore logging failure to avoid breaking the request path.
  }
}

export function attachRateLimitHeaders(response: NextResponse, limit: number, remaining: number, reset: number) {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(reset));
}
