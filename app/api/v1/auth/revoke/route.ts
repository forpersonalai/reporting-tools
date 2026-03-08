import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiResponse.error("Unauthorized", "UNAUTHORIZED", 401);
  }

  const body = (await req.json()) as { apiKeyId?: string };
  if (!body.apiKeyId) return apiResponse.error("apiKeyId wajib diisi", "VALIDATION_ERROR", 400);

  await prisma.apiKey.update({
    where: { id: body.apiKeyId, userId: session.user.id },
    data: { isActive: false },
  });

  return apiResponse.success({ revoked: true });
}
