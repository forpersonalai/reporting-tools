export type PrintStatusType = "SUCCESS" | "FAILED" | "PENDING" | "CANCELLED";
export type ReportStatusType = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ReportFileTypeType = "PDF" | "EXCEL" | "WORD" | "CSV" | "HTML";

export interface SimpleUser {
  id: string;
  name: string;
  department?: string | null;
}

export interface ReportListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl?: string | null;
  fileType: ReportFileTypeType;
  status: ReportStatusType;
  tags: string[];
  printCount: number;
  createdBy: SimpleUser;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetailItem extends ReportListItem {
  metadata?: Record<string, unknown> | null;
}

export interface WorkflowNodeMeta {
  id: string;
  label: string;
  order: number;
}

export interface ReportParameter {
  id: string;
  label: string;
  value: string;
}

export interface ReportFilterConfig {
  field: string;
  value: string;
}

export type ReportPageOrientation = "PORTRAIT" | "LANDSCAPE";

export type ReportLayoutSection = "title" | "columnHeader" | "detail" | "summary";

export interface ReportLayoutItem {
  field: string;
  label: string;
  section: ReportLayoutSection;
  order: number;
}

export type ReportAggregateType = "NONE" | "SUM" | "AVG" | "COUNT" | "MIN" | "MAX";

export interface ReportWorkflowMeta {
  sourceName: string;
  filterRule: string;
  summaryFocus: string;
  outputName: string;
  orientation: ReportPageOrientation;
  parameters: ReportParameter[];
  filterBy: ReportFilterConfig;
  selectedFields: string[];
  nodes: WorkflowNodeMeta[];
  layout: ReportLayoutItem[];
  aggregates: Record<string, ReportAggregateType>;
}

export interface PrintHistoryItem {
  id: string;
  printedAt: string;
  copies: number;
  pageCount: number;
  printerName: string;
  status: PrintStatusType;
  duration: number;
  report: {
    id: string;
    title: string;
    category: string;
  };
  user: SimpleUser;
}

export type PrintFeedItem = PrintHistoryItem;

export interface DashboardStats {
  summary: {
    totalReports: number;
    todayPrints: number;
    totalPages: number;
    activeUsers: number;
    reportsChange: number;
    todayPrintChange: number;
    pagesChange: number;
    activeUsersChangeLabel: string;
    failedPrints: number;
  };
  hourlyTrend: Array<{ label: string; count: number }>;
  topReports: Array<{ reportId: string; title: string; printCount: number }>;
  byDepartment: Array<{ name: string; value: number }>;
  heatmap: Array<{ day: string; hour: number; value: number }>;
  recentPrints: PrintHistoryItem[];
}
