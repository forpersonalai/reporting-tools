import crypto from "node:crypto";

import { prisma } from "@/lib/db";

export async function dispatchWebhook(event: string, data: object) {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true, events: { contains: event } },
  });

  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      const payload = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      });

      const signature = crypto.createHmac("sha256", webhook.secret).update(payload).digest("hex");

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Signature": `sha256=${signature}`,
            "X-Event": event,
          },
          body: payload,
          signal: AbortSignal.timeout(Number(process.env.WEBHOOK_TIMEOUT_MS ?? 10000)),
        });

        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastCalledAt: new Date(),
            failCount: response.ok ? 0 : { increment: 1 },
          },
        });
      } catch {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { failCount: { increment: 1 } },
        });
      }
    }),
  );
}
