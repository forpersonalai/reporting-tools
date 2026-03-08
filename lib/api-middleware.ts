import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export type ApiScope =
  | "reports:read"
  | "reports:write"
  | "print:read"
  | "print:write"
  | "users:read"
  | "users:write"
  | "dashboard:read"
  | "admin:all";

type ApiValidationResult =
  | { success: true; userId: string; apiKeyId: string; rateLimit: number }
  | { success: false; error: string; code: string; status: number };

export async function validateApiKey(req: NextRequest, requiredScopes: ApiScope[]): Promise<ApiValidationResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { success: false, error: "Missing or invalid Authorization header", code: "UNAUTHORIZED", status: 401 };
  }

  const rawKey = authHeader.replace("Bearer ", "").trim();
  const segments = rawKey.split("_");
  const prefix = segments.length >= 2 ? `${segments[0]}_${segments[1]}_` : rawKey.slice(0, 12);

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyPrefix: prefix, isActive: true },
  });

  if (!apiKey) {
    return { success: false, error: "Invalid API key", code: "UNAUTHORIZED", status: 401 };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { success: false, error: "API key expired", code: "UNAUTHORIZED", status: 401 };
  }

  const isValid = await bcrypt.compare(rawKey, apiKey.keyHash);
  if (!isValid) {
    return { success: false, error: "Invalid API key", code: "UNAUTHORIZED", status: 401 };
  }

  const scopes = JSON.parse(apiKey.scopes) as ApiScope[];
  const hasScope = requiredScopes.every((scope) => scopes.includes(scope) || scopes.includes("admin:all"));
  if (!hasScope) {
    return { success: false, error: "Insufficient scope", code: "FORBIDDEN", status: 403 };
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { success: true, userId: apiKey.userId, apiKeyId: apiKey.id, rateLimit: apiKey.rateLimit };
}

export const apiResponse = {
  success(data: unknown, meta?: object, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
        ...(meta ? { meta } : {}),
        timestamp: new Date().toISOString(),
      },
      { status },
    );
  },
  error(message: string, code: string, status = 400, details?: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
          ...(details ? { details } : {}),
        },
        timestamp: new Date().toISOString(),
      },
      { status },
    );
  },
};
