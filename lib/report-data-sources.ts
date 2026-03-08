export type ReportDataSourceField = {
  key: string;
  label: string;
  preview: string;
  align?: "left" | "center" | "right";
  kind?: "text" | "number" | "date";
};

export type ReportDataSource = {
  key: string;
  label: string;
  tableName: string;
  description: string;
  fields: ReportDataSourceField[];
  defaultFields: string[];
  sampleRows: Array<Record<string, string | number>>;
};

export const reportDataSources: ReportDataSource[] = [
  {
    key: "print_logs",
    label: "Print Logs",
    tableName: "print_logs",
    description: "Riwayat aktivitas print per user, printer, dan laporan.",
    defaultFields: ["printed_at", "report_title", "user_name", "copies", "page_count", "status"],
    fields: [
      { key: "printed_at", label: "Printed At", preview: "08/03/2026 09:15", kind: "date", align: "center" },
      { key: "report_title", label: "Report Title", preview: "Rekap Penjualan Q1 2026" },
      { key: "report_category", label: "Report Category", preview: "Sales" },
      { key: "user_name", label: "User Name", preview: "Budi Santoso" },
      { key: "department", label: "Department", preview: "Finance" },
      { key: "copies", label: "Copies", preview: "2", kind: "number", align: "right" },
      { key: "page_count", label: "Page Count", preview: "12", kind: "number", align: "right" },
      { key: "printer_name", label: "Printer Name", preview: "HP-Lantai-2" },
      { key: "status", label: "Status", preview: "SUCCESS", align: "center" },
      { key: "duration", label: "Duration", preview: "4320", kind: "number", align: "right" },
    ],
    sampleRows: [
      { printed_at: "08/03/2026 09:15", report_title: "Rekap Penjualan Q1 2026", report_category: "Sales", user_name: "Budi Santoso", department: "Finance", copies: 2, page_count: 12, printer_name: "HP-Lantai-2", status: "SUCCESS", duration: 4320 },
      { printed_at: "08/03/2026 10:02", report_title: "Laporan Keuangan Maret 2026", report_category: "Finance", user_name: "Siti Rahayu", department: "Finance", copies: 1, page_count: 7, printer_name: "HP-Lantai-3", status: "FAILED", duration: 2100 },
      { printed_at: "08/03/2026 11:20", report_title: "Checklist Maintenance Printer", report_category: "Operations", user_name: "Eko Prasetyo", department: "Operations", copies: 3, page_count: 9, printer_name: "Canon-RoomA", status: "SUCCESS", duration: 3980 },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    tableName: "reports",
    description: "Master data laporan yang tersedia di sistem.",
    defaultFields: ["title", "category", "status", "file_type", "created_at", "updated_at"],
    fields: [
      { key: "title", label: "Title", preview: "Laporan Keuangan Maret 2026" },
      { key: "description", label: "Description", preview: "Rekap cashflow dan operasional bulanan." },
      { key: "category", label: "Category", preview: "Finance" },
      { key: "file_type", label: "File Type", preview: "PDF", align: "center" },
      { key: "status", label: "Status", preview: "PUBLISHED", align: "center" },
      { key: "created_by", label: "Created By", preview: "Siti Rahayu" },
      { key: "created_at", label: "Created At", preview: "2026-03-01 08:30", kind: "date", align: "center" },
      { key: "updated_at", label: "Updated At", preview: "2026-03-08 05:15", kind: "date", align: "center" },
    ],
    sampleRows: [
      { title: "Laporan Keuangan Maret 2026", description: "Rekap cashflow dan operasional bulanan.", category: "Finance", file_type: "PDF", status: "PUBLISHED", created_by: "Siti Rahayu", created_at: "2026-03-01 08:30", updated_at: "2026-03-08 05:15" },
      { title: "Rekap Penjualan Q1 2026", description: "Penjualan seluruh region.", category: "Sales", file_type: "PDF", status: "PUBLISHED", created_by: "Budi Santoso", created_at: "2026-02-20 08:00", updated_at: "2026-03-07 15:20" },
      { title: "Checklist Maintenance Printer", description: "Pemeliharaan printer per lantai.", category: "Operations", file_type: "PDF", status: "DRAFT", created_by: "Eko Prasetyo", created_at: "2026-03-05 13:00", updated_at: "2026-03-08 04:45" },
    ],
  },
  {
    key: "users",
    label: "Users",
    tableName: "users",
    description: "Data user internal untuk laporan user activity atau ownership.",
    defaultFields: ["name", "email", "role", "department", "created_at"],
    fields: [
      { key: "name", label: "Name", preview: "Demo Admin" },
      { key: "email", label: "Email", preview: "admin@reporttrack.local" },
      { key: "role", label: "Role", preview: "ADMIN", align: "center" },
      { key: "department", label: "Department", preview: "IT" },
      { key: "created_at", label: "Created At", preview: "2026-02-10 10:00", kind: "date", align: "center" },
      { key: "updated_at", label: "Updated At", preview: "2026-03-08 05:10", kind: "date", align: "center" },
    ],
    sampleRows: [
      { name: "Demo Admin", email: "admin@reporttrack.local", role: "ADMIN", department: "IT", created_at: "2026-02-10 10:00", updated_at: "2026-03-08 05:10" },
      { name: "Budi Santoso", email: "budi@reporttrack.local", role: "MANAGER", department: "Sales", created_at: "2026-01-15 08:30", updated_at: "2026-03-08 08:20" },
      { name: "Siti Rahayu", email: "siti@reporttrack.local", role: "USER", department: "Finance", created_at: "2026-01-20 09:00", updated_at: "2026-03-08 09:00" },
    ],
  },
  {
    key: "notifications",
    label: "Notifications",
    tableName: "notifications",
    description: "Event notifikasi internal yang dikirim ke user.",
    defaultFields: ["type", "title", "user_id", "is_read", "created_at"],
    fields: [
      { key: "type", label: "Type", preview: "PRINT_SUCCESS", align: "center" },
      { key: "title", label: "Title", preview: "Print berhasil" },
      { key: "message", label: "Message", preview: "2 salinan berhasil dicetak." },
      { key: "user_id", label: "User ID", preview: "usr-budi" },
      { key: "is_read", label: "Is Read", preview: "false", align: "center" },
      { key: "created_at", label: "Created At", preview: "2026-03-08 09:16", kind: "date", align: "center" },
    ],
    sampleRows: [
      { type: "PRINT_SUCCESS", title: "Print berhasil", message: "2 salinan berhasil dicetak.", user_id: "usr-budi", is_read: "false", created_at: "2026-03-08 09:16" },
      { type: "PRINT_FAILED", title: "Print gagal", message: "Printer HP-Lantai-3 tidak merespons.", user_id: "usr-siti", is_read: "false", created_at: "2026-03-08 10:02" },
      { type: "REPORT_SHARED", title: "Laporan dibagikan", message: "Laporan Q1 dibagikan ke Finance.", user_id: "usr-eko", is_read: "true", created_at: "2026-03-08 11:20" },
    ],
  },
];

export function getDefaultReportDataSource() {
  return reportDataSources[0];
}

export function getReportDataSource(key?: string | null) {
  return reportDataSources.find((source) => source.key === key) ?? getDefaultReportDataSource();
}

export function getSourceFieldMeta(sourceKey: string, fieldKey: string) {
  const source = getReportDataSource(sourceKey);
  return source.fields.find((field) => field.key === fieldKey);
}

export function getSourceSampleRows(sourceKey: string) {
  return getReportDataSource(sourceKey).sampleRows;
}
