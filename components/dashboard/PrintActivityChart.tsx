"use client";

import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSyncExternalStore } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

const pieColors = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"];
const axisColor = "#64748b";

export function PrintActivityChart({ stats }: { stats: DashboardStats }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Card className="fade-up">
          <CardHeader>
            <CardTitle>Aktivitas print 24 jam terakhir</CardTitle>
          </CardHeader>
          <CardContent className="h-80 animate-pulse rounded-[20px] bg-white/40" />
        </Card>
        <div className="grid gap-5">
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

  return (
    <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      <Card className="fade-up">
        <CardHeader>
          <CardTitle>Aktivitas print 24 jam terakhir</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.hourlyTrend}>
              <XAxis dataKey="label" stroke={axisColor} />
              <YAxis stroke={axisColor} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: "#4f46e5" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid gap-5">
        <Card className="fade-up">
          <CardHeader>
            <CardTitle>Top laporan paling sering dicetak</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topReports}>
                <XAxis dataKey="title" hide />
                <YAxis stroke={axisColor} />
                <Tooltip />
                <Bar dataKey="printCount" radius={[12, 12, 0, 0]}>
                  {stats.topReports.map((entry, index) => (
                    <Cell key={entry.reportId} fill={index === 0 ? "#4f46e5" : "#818cf8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="fade-up">
          <CardHeader>
            <CardTitle>Distribusi per departemen</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
        </Card>
      </div>
    </div>
  );
}
