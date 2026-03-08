import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import { attachRateLimitHeaders, authorizeRequest, logApiUsage } from "@/lib/public-api";

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const authz = await authorizeRequest(req, ["admin:all"]);
  if ("response" in authz) return authz.response;

  const body = (await req.json()) as { url?: string; events?: string[]; secret?: string };
  if (!body.url || !body.secret) {
    const response = apiResponse.error("url dan secret wajib diisi", "VALIDATION_ERROR", 400);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }

  try {
    const webhook = await prisma.webhook.create({
      data: {
        userId: authz.userId,
        url: body.url,
        secret: body.secret,
        events: JSON.stringify(body.events ?? ["print.created"]),
      },
    });

    const response = apiResponse.success(webhook, undefined, 201);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  } catch {
    const response = apiResponse.error("Gagal mendaftarkan webhook", "INTERNAL_ERROR", 500);
    attachRateLimitHeaders(response, authz.rateLimit.limit, authz.rateLimit.remaining, authz.rateLimit.reset);
    await logApiUsage(req, authz.apiKeyId, response.status, startedAt);
    return response;
  }
}
