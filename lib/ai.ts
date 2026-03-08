import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export async function generateDashboardSummary(context: string) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "Kamu adalah analis dashboard reporting tools perusahaan. Beri ringkasan Bahasa Indonesia yang padat, berorientasi manajerial, maksimal 6 poin, dan sertakan rekomendasi yang bisa ditindaklanjuti.",
      messages: [{ role: "user", content: context }],
    });

    return {
      provider: "Claude",
      stream: stream,
      type: "anthropic" as const,
    };
  }

  if (openAiKey) {
    const openai = new OpenAI({ apiKey: openAiKey });
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Kamu adalah analis dashboard reporting tools perusahaan. Beri ringkasan Bahasa Indonesia yang padat, berorientasi manajerial, maksimal 6 poin, dan sertakan rekomendasi yang bisa ditindaklanjuti.",
        },
        { role: "user", content: context },
      ],
      stream: true,
    });

    return {
      provider: "OpenAI",
      stream: response,
      type: "openai" as const,
    };
  }

  return {
    provider: "Demo AI",
    type: "mock" as const,
    text: `📈 Aktivitas print hari ini meningkat dibanding kemarin, dengan lonjakan utama pada jam kerja pagi.\n\n🏆 Laporan penjualan dan laporan keuangan masih mendominasi volume cetak.\n\n⚠️ Ada indikasi kegagalan print pada salah satu printer lantai 3 yang perlu dicek.\n\n👥 Departemen Finance dan Sales menjadi kontributor aktivitas tertinggi.\n\n💡 Rekomendasi: audit printer bermasalah, atur antrean print pagi, dan dorong distribusi digital untuk laporan berulang.`,
  };
}
