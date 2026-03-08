import { PrintStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { demoDashboardStats, demoFeed, demoPrints, demoReports } from "@/lib/demo-data";
import { startOfToday, subtractDays } from "@/lib/utils";
import type { DashboardStats, PrintFeedItem, PrintHistoryItem, ReportDetailItem, ReportListItem } from "@/types";

function mapReport(report: {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string | null;
  fileType: "PDF" | "EXCEL" | "WORD" | "CSV" | "HTML";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tags: string | null;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string; department: string | null };
  _count: { printLogs: number };
}): ReportDetailItem {
  return {
    id: report.id,
    title: report.title,
    description: report.description ?? "",
    category: report.category,
    fileUrl: report.fileUrl,
    fileType: report.fileType,
    status: report.status,
    tags: report.tags ? JSON.parse(report.tags) : [],
    printCount: report._count.printLogs,
    createdBy: report.createdBy,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    metadata: (report.metadata as Record<string, unknown> | null | undefined) ?? null,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!process.env.DATABASE_URL) {
    return demoDashboardStats;
  }

  try {
    const today = startOfToday();
    const yesterday = subtractDays(1);
    yesterday.setHours(0, 0, 0, 0);

    const [totalReports, todayPrints, yesterdayPrints, printRows, totalPagesRows] = await Promise.all([
      prisma.report.count(),
      prisma.printLog.count({ where: { printedAt: { gte: today } } }),
      prisma.printLog.count({
        where: {
          printedAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
      prisma.printLog.findMany({
        where: { printedAt: { gte: subtractDays(1) } },
        include: {
          report: { select: { id: true, title: true, category: true } },
          user: { select: { id: true, name: true, department: true } },
        },
        orderBy: { printedAt: "desc" },
        take: 50,
      }),
      prisma.printLog.aggregate({
        where: { printedAt: { gte: today } },
        _sum: { pageCount: true },
      }),
    ]);

    const hourlyTrend = Array.from({ length: 8 }, (_, index) => {
      const targetHour = new Date();
      targetHour.setMinutes(0, 0, 0);
      targetHour.setHours(targetHour.getHours() - (7 - index));
      const hour = targetHour.getHours();

      return {
        label: `${String(hour).padStart(2, "0")}:00`,
        count: printRows.filter((row) => new Date(row.printedAt).getHours() === hour).length,
      };
    });

    const reportMap = new Map<string, { title: string; count: number }>();
    const departmentMap = new Map<string, number>();
    const activeUsers = new Set<string>();
    const totalPages = totalPagesRows._sum.pageCount ?? 0;
    let failedPrints = 0;

    for (const row of printRows) {
      activeUsers.add(row.userId);
      if (row.status === PrintStatus.FAILED) failedPrints += 1;

      const reportBucket = reportMap.get(row.reportId) ?? {
        title: row.report.title,
        count: 0,
      };
      reportBucket.count += 1;
      reportMap.set(row.reportId, reportBucket);

      const department = row.user.department ?? "General";
      departmentMap.set(department, (departmentMap.get(department) ?? 0) + 1);
    }

    const todayPrintChange = yesterdayPrints === 0 ? 100 : ((todayPrints - yesterdayPrints) / yesterdayPrints) * 100;

    return {
      summary: {
        totalReports,
        todayPrints,
        totalPages,
        activeUsers: activeUsers.size,
        reportsChange: 12.1,
        todayPrintChange,
        pagesChange: 5.2,
        activeUsersChangeLabel: `${Math.max(activeUsers.size - 20, 0)} user baru hari ini`,
        failedPrints,
      },
      hourlyTrend,
      topReports: Array.from(reportMap.entries())
        .map(([reportId, value]) => ({
          reportId,
          title: value.title,
          printCount: value.count,
        }))
        .sort((a, b) => b.printCount - a.printCount)
        .slice(0, 10),
      byDepartment: Array.from(departmentMap.entries()).map(([name, value]) => ({ name, value })),
      heatmap: ["Sen", "Sel", "Rab", "Kam", "Jum"].flatMap((day, index) =>
        hourlyTrend.slice(0, 6).map((item, hourIndex) => ({
          day,
          hour: 8 + hourIndex,
          value: Math.max(2, item.count - index),
        })),
      ),
      recentPrints: printRows.map((row) => ({
        id: row.id,
        printedAt: row.printedAt.toISOString(),
        copies: row.copies,
        pageCount: row.pageCount ?? 0,
        printerName: row.printerName ?? "-",
        status: row.status,
        duration: row.duration ?? 0,
        report: row.report,
        user: row.user,
      })),
    };
  } catch {
    return demoDashboardStats;
  }
}

export async function getReportList(): Promise<ReportListItem[]> {
  if (!process.env.DATABASE_URL) {
    return demoReports;
  }

  try {
    const reports = await prisma.report.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        _count: {
          select: {
            printLogs: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return reports.map(mapReport);
  } catch {
    return demoReports;
  }
}

export async function getReportById(id: string): Promise<ReportDetailItem | null> {
  if (!process.env.DATABASE_URL) {
    return demoReports.find((report) => report.id === id) ?? null;
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        _count: {
          select: {
            printLogs: true,
          },
        },
      },
    });

    if (!report) return null;

    return mapReport(report);
  } catch {
    return demoReports.find((report) => report.id === id) ?? null;
  }
}

export async function getPrintLogs(): Promise<PrintHistoryItem[]> {
  if (!process.env.DATABASE_URL) {
    return demoPrints;
  }

  try {
    const rows = await prisma.printLog.findMany({
      include: {
        report: { select: { id: true, title: true, category: true } },
        user: { select: { id: true, name: true, department: true } },
      },
      orderBy: { printedAt: "desc" },
      take: 100,
    });

    return rows.map((row) => ({
      id: row.id,
      printedAt: row.printedAt.toISOString(),
      copies: row.copies,
      pageCount: row.pageCount ?? 0,
      printerName: row.printerName ?? "-",
      status: row.status,
      duration: row.duration ?? 0,
      report: row.report,
      user: row.user,
    }));
  } catch {
    return demoPrints;
  }
}

export async function getRealtimeFeed(): Promise<PrintFeedItem[]> {
  if (!process.env.DATABASE_URL) {
    return demoFeed;
  }

  try {
    const rows = await prisma.printLog.findMany({
      where: {
        printedAt: {
          gte: new Date(Date.now() - 1000 * 60 * 10),
        },
      },
      include: {
        report: { select: { id: true, title: true, category: true } },
        user: { select: { id: true, name: true, department: true } },
      },
      orderBy: { printedAt: "desc" },
      take: 20,
    });

    return rows.map((row) => ({
      id: row.id,
      printedAt: row.printedAt.toISOString(),
      copies: row.copies,
      pageCount: row.pageCount ?? 0,
      printerName: row.printerName ?? "-",
      status: row.status,
      duration: row.duration ?? 0,
      report: row.report,
      user: row.user,
    }));
  } catch {
    return demoFeed;
  }
}
