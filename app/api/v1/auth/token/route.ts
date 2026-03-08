import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-middleware";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiResponse.error("Unauthorized", "UNAUTHORIZED", 401);
  }

  const body = (await req.json()) as { name?: string; scopes?: string[]; expiresAt?: string };
  const raw = crypto.randomBytes(24).toString("hex");
  const key = `rtk_live_${raw}`;
  const keyHash = await bcrypt.hash(key, 10);

  try {
    const created = await prisma.apiKey.create({
      data: {
        name: body.name ?? "Default API Key",
        keyHash,
        keyPrefix: "rtk_live_",
        userId: session.user.id,
        scopes: JSON.stringify(body.scopes ?? ["reports:read", "dashboard:read"]),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
      select: { id: true, name: true, keyPrefix: true, scopes: true, expiresAt: true, createdAt: true },
    });

    return apiResponse.success({ ...created, key }, undefined, 201);
  } catch {
    return apiResponse.error("Gagal membuat API key", "INTERNAL_ERROR", 500);
  }
}
