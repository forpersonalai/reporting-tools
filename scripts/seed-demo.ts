import "dotenv/config";

import bcrypt from "bcryptjs";

import { PrismaClient, ReportFileType, ReportStatus, PrintStatus, Role } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

async function seedUsers() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const users = [
    {
      id: "demo-admin-db",
      name: "Admin",
      email: "admin@reporting.dev",
      password: passwordHash,
      role: Role.ADMIN,
      department: "IT",
    },
    {
      id: "usr-budi",
      name: "Budi Santoso",
      email: "budi@reporttrack.local",
      password: passwordHash,
      role: Role.MANAGER,
      department: "Sales",
    },
    {
      id: "usr-siti",
      name: "Siti Rahayu",
      email: "siti@reporttrack.local",
      password: passwordHash,
      role: Role.USER,
      department: "Finance",
    },
    {
      id: "usr-eko",
      name: "Eko Prasetyo",
      email: "eko@reporttrack.local",
      password: passwordHash,
      role: Role.USER,
      department: "Operations",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: user.password,
        role: user.role,
        department: user.department,
      },
      create: user,
    });
  }
}

async function seedReports() {
  const reports = [
    {
      id: "rpt-sales-q1",
      title: "Rekap Penjualan Q1 2026",
      description: "Laporan penjualan seluruh region untuk triwulan pertama.",
      category: "Sales",
      fileType: ReportFileType.PDF,
      status: ReportStatus.PUBLISHED,
      tags: JSON.stringify(["sales", "q1", "2026"]),
      createdById: "usr-budi",
    },
    {
      id: "rpt-finance-march",
      title: "Laporan Keuangan Maret 2026",
      description: "Rekap cashflow dan operasional bulanan.",
      category: "Finance",
      fileType: ReportFileType.EXCEL,
      status: ReportStatus.PUBLISHED,
      tags: JSON.stringify(["finance", "monthly"]),
      createdById: "usr-siti",
    },
    {
      id: "rpt-ops-maintenance",
      title: "Checklist Maintenance Printer",
      description: "Laporan pemeliharaan printer per lantai.",
      category: "Operations",
      fileType: ReportFileType.PDF,
      status: ReportStatus.DRAFT,
      tags: JSON.stringify(["maintenance", "printer"]),
      createdById: "usr-eko",
    },
  ];

  for (const report of reports) {
    await prisma.report.upsert({
      where: { id: report.id },
      update: {
        title: report.title,
        description: report.description,
        category: report.category,
        fileType: report.fileType,
        status: report.status,
        tags: report.tags,
        createdById: report.createdById,
      },
      create: report,
    });
  }
}

async function seedPrintLogs() {
  const existing = await prisma.printLog.count();
  if (existing > 0) return;

  const now = Date.now();
  const rows = [
    {
      id: "pl-1",
      reportId: "rpt-sales-q1",
      userId: "usr-siti",
      printedAt: new Date(now - 60 * 60 * 1000),
      copies: 2,
      pageCount: 12,
      printerName: "HP-Floor2",
      status: PrintStatus.SUCCESS,
      duration: 4320,
    },
    {
      id: "pl-2",
      reportId: "rpt-finance-march",
      userId: "usr-budi",
      printedAt: new Date(now - 35 * 60 * 1000),
      copies: 1,
      pageCount: 7,
      printerName: "HP-Floor3",
      status: PrintStatus.FAILED,
      duration: 2100,
    },
    {
      id: "pl-3",
      reportId: "rpt-sales-q1",
      userId: "usr-eko",
      printedAt: new Date(now - 15 * 60 * 1000),
      copies: 3,
      pageCount: 9,
      printerName: "Canon-RoomA",
      status: PrintStatus.SUCCESS,
      duration: 3980,
    },
  ];

  for (const row of rows) {
    await prisma.printLog.create({ data: row });
  }
}

async function main() {
  await seedUsers();
  await seedReports();
  await seedPrintLogs();

  const [users, reports, prints] = await Promise.all([
    prisma.user.count(),
    prisma.report.count(),
    prisma.printLog.count(),
  ]);

  console.log({ users, reports, prints });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
