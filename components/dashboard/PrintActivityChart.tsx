"use client";

import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSyncExternalStore } from "react";
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { DashboardStats } from "@/types";

const pieColors = ["#1d4ed8", "#0f766e", "#f97316", "#ca8a04", "#7c3aed"];
const axisColor = "#64748b";

export function PrintActivityChart({ stats }: { stats: DashboardStats }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <Card className="fade-up">
          <CardHeader>
            <CardTitle>Aktivitas print 24 jam terakhir</CardTitle>
          </CardHeader>
          <CardContent className="h-80 animate-pulse rounded-[20px] bg-white/40" />
        </Card>
        <div className="grid gap-6">
          <Card className="fade-up">
            <CardHeader>
              <CardTitle>Top laporan paling sering dicetak</CardTitle>
            </CardHeader>
            <CardContent className="h-64 animate-pulse rounded-[20px] bg-white/40" />
          </Card>
          <Card className="fade-up">
            <CardHeader>
              <CardTitle>Distribusi per departemen</CardTitle>
            </CardHeader>
            <CardContent className="h-64 animate-pulse rounded-[20px] bg-white/40" />
          </Card>
        </div>
      </div>
    );
  }

  const peakHour = stats.hourlyTrend.reduce((best, current) => (current.count > best.count ? current : best), stats.hourlyTrend[0]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
      <Card className="fade-up overflow-hidden">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              Aktivitas print
            </div>
            <CardTitle className="mt-3 text-xl md:text-2xl">Pola cetak 24 jam terakhir</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Jam sibuk terlihat jelas untuk membantu optimasi beban printer dan jadwal operasional.</p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Peak hour</p>
              <p className="mt-2 text-2xl font-semibold">{peakHour?.label ?? "-"}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total prints</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(stats.summary.todayPrints)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.hourlyTrend}>
              <XAxis dataKey="label" stroke={axisColor} />
              <YAxis stroke={axisColor} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4, fill: "#1d4ed8" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="fade-up">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
              <BarChart3 className="h-3.5 w-3.5" />
              Top reports
            </div>
            <CardTitle className="mt-3 text-xl">Laporan teratas</CardTitle>
            <p className="text-sm text-muted-foreground">Dokumen yang paling sering dicetak hari ini.</p>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topReports}>
                <XAxis dataKey="title" hide />
                <YAxis stroke={axisColor} />
                <Tooltip />
                <Bar dataKey="printCount" radius={[12, 12, 0, 0]}>
                  {stats.topReports.map((entry, index) => (
                    <Cell key={entry.reportId} fill={index === 0 ? "#1d4ed8" : "#93c5fd"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stats.topReports.slice(0, 3).map((item, index) => (
                <div key={item.reportId} className="flex items-center justify-between rounded-[18px] border border-border bg-background/72 px-4 py-3 text-sm">
                  <p className="min-w-0 truncate font-medium">{index + 1}. {item.title}</p>
                  <span className="text-muted-foreground">{item.printCount}x</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="fade-up">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
              <PieChartIcon className="h-3.5 w-3.5" />
              Department mix
            </div>
            <CardTitle className="mt-3 text-xl">Distribusi per departemen</CardTitle>
            <p className="text-sm text-muted-foreground">Komposisi aktivitas print untuk melihat area dengan permintaan tertinggi.</p>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byDepartment} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {stats.byDepartment.map((item, index) => (
                    <Cell key={item.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stats.byDepartment.slice(0, 4).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
