import { getDashboardStats } from "@/lib/dashboard";
import { generateDashboardSummary } from "@/lib/ai";

export async function POST() {
  const stats = await getDashboardStats();
  const context = `
Data dashboard reporting tools hari ini:
- Total laporan: ${stats.summary.totalReports}
- Total print hari ini: ${stats.summary.todayPrints}
- Total halaman hari ini: ${stats.summary.totalPages}
- User aktif: ${stats.summary.activeUsers}
- Print gagal: ${stats.summary.failedPrints}
- Top reports: ${stats.topReports.map((item) => `${item.title} (${item.printCount}x)`).join(", ")}
- Distribusi departemen: ${stats.byDepartment.map((item) => `${item.name} ${item.value}%`).join(", ")}
- Tren per jam: ${stats.hourlyTrend.map((item) => `${item.label}=${item.count}`).join(", ")}
  `;

  const result = await generateDashboardSummary(context);
  const encoder = new TextEncoder();

  if (result.type === "mock") {
    return new Response(result.text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-AI-Provider": result.provider,
      },
    });
  }

  if (result.type === "anthropic") {
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-AI-Provider": result.provider,
      },
    });
  }

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of result.stream as AsyncIterable<{ type?: string; delta?: string }>) {
        if (event.type === "response.output_text.delta" && event.delta) {
          controller.enqueue(encoder.encode(event.delta));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-AI-Provider": result.provider,
    },
  });
}
