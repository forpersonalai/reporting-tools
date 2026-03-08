import { NextRequest, NextResponse } from "next/server";

import { getPrintLogs } from "@/lib/dashboard";

export async function GET(req: NextRequest) {
  const rows = await getPrintLogs();
  const status = req.nextUrl.searchParams.get("status");
  const filtered = status ? rows.filter((row) => row.status === status) : rows;

  return NextResponse.json({
    success: true,
    data: filtered,
    meta: { total: filtered.length },
    timestamp: new Date().toISOString(),
  });
}
