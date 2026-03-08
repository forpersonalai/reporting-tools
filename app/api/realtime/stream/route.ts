import { getRealtimeFeed } from "@/lib/dashboard";

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ type: "init", data: await getRealtimeFeed() });

      const heartbeat = setInterval(() => {
        send({ type: "ping", timestamp: new Date().toISOString() });
      }, 15000);

      const poll = setInterval(async () => {
        const latest = await getRealtimeFeed();
        if (latest.length > 0) {
          send({ type: "new_prints", data: latest.slice(0, 5) });
        }
      }, 5000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearInterval(poll);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
