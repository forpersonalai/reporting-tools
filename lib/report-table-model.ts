import { getSourceFieldMeta } from "@/lib/report-data-sources";
import { getFieldLabel } from "@/lib/report-workflow";
import type { ReportPreviewGroupWithTotals } from "@/lib/report-builder";

export type ReportTableAlignment = "left" | "center" | "right";

export type ReportTableColumn = {
  key: string;
  label: string;
  alignment: ReportTableAlignment;
  kind: "text" | "number";
};

export type ReportTableCell = {
  rawValue: string | number;
  displayValue: string;
  alignment: ReportTableAlignment;
  kind: "text" | "number";
};

export type ReportTableRow = {
  index: number;
  rowTone: "odd" | "even";
  cells: ReportTableCell[];
};

export type ReportTableTotalCell = {
  field: string;
  displayValue: string;
  alignment: ReportTableAlignment;
  kind: "text" | "number";
};

export type ReportTableGroupModel = {
  key: string;
  value: string;
  label: string | null;
  columns: ReportTableColumn[];
  rows: ReportTableRow[];
  emptyMessage: string;
  totalLabelColSpan: number;
  totalCells: ReportTableTotalCell[];
};

export function formatReportTableValue(value: string | number, kind: "text" | "number") {
  if (kind === "number" && typeof value === "number") {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return String(value ?? "");
}

export function buildReportTableGroups({
  previewGroups,
  selectedFilterFieldLabel,
  sourceName,
  tableFields,
}: {
  previewGroups: ReportPreviewGroupWithTotals[];
  selectedFilterFieldLabel?: string | null;
  sourceName: string;
  tableFields: string[];
}) {
  const columns: ReportTableColumn[] = tableFields.map((field) => {
    const meta = getSourceFieldMeta(sourceName, field);
    const kind = meta?.kind === "number" ? "number" : "text";

    return {
      key: field,
      label: getFieldLabel(sourceName, field),
      alignment: meta?.kind === "number" ? "right" : meta?.align === "center" ? "center" : "left",
      kind,
    };
  });

  return previewGroups.map<ReportTableGroupModel>((group) => ({
    key: group.key,
    value: group.value,
    label: selectedFilterFieldLabel ?? null,
    columns,
    rows: group.rows.map((row, index) => ({
      index: index + 1,
      rowTone: index % 2 === 0 ? "odd" : "even",
      cells: columns.map((column) => {
        const rawValue = row[column.key] ?? "";

        return {
          rawValue,
          displayValue: formatReportTableValue(rawValue, column.kind),
          alignment: column.alignment,
          kind: column.kind,
        };
      }),
    })),
    emptyMessage: "Tidak ada data.",
    totalLabelColSpan: group.totalLabelColSpan,
    totalCells: columns
      .slice(group.totalLabelColSpan - 1)
      .map((column) => {
        const rawValue = group.totals[column.key] ?? "";

        return {
          field: column.key,
          displayValue: typeof rawValue === "number" ? formatReportTableValue(rawValue, column.kind) : "",
          alignment: column.alignment,
          kind: column.kind,
        };
      }),
  }));
}
