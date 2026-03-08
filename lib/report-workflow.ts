import type { ReportAggregateType, ReportFilterConfig, ReportLayoutItem, ReportLayoutSection, ReportParameter, ReportWorkflowMeta } from "@/types";
import { getDefaultReportDataSource, getReportDataSource, getSourceFieldMeta } from "@/lib/report-data-sources";
export function getFieldLabel(sourceName: string, key: string) {
  return getSourceFieldMeta(sourceName, key)?.label ?? key;
}

export function getFieldPreviewValue(sourceName: string, key: string) {
  return getSourceFieldMeta(sourceName, key)?.preview ?? "Tersedia di PDF";
}

export function buildDefaultLayout(sourceName: string, fields: string[]): ReportLayoutItem[] {
  const source = getReportDataSource(sourceName);
  const selected = fields.length ? fields : source.defaultFields;
  const detailFields = selected.slice(0, 4);

  const layout: ReportLayoutItem[] = [
    {
      field: selected[0],
      label: getFieldLabel(source.key, selected[0]),
      section: "title",
      order: 1,
    },
    {
      field: selected[1] ?? selected[0],
      label: getFieldLabel(source.key, selected[1] ?? selected[0]),
      section: "title",
      order: 2,
    },
  ];

  detailFields.forEach((field, index) => {
    layout.push({
      field,
      label: getFieldLabel(source.key, field),
      section: "detail",
      order: index + 1,
    });
  });

  selected
    .filter((field) => !detailFields.includes(field))
    .slice(0, 3)
    .forEach((field, index) => {
      layout.push({
        field,
        label: getFieldLabel(source.key, field),
        section: "summary",
        order: index + 1,
      });
    });

  return normalizeLayout(source.key, layout);
}

export function normalizeLayout(sourceName: string, layout: ReportLayoutItem[]): ReportLayoutItem[] {
  const orderedSections: ReportLayoutSection[] = ["title", "columnHeader", "detail", "summary"];

  return orderedSections.flatMap((section) =>
    layout
      .filter((item) => item.section === section)
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({
        ...item,
        label: item.label || getFieldLabel(sourceName, item.field),
        order: index + 1,
      })),
  );
}

export function normalizeWorkflowMetadata(metadata: unknown): ReportWorkflowMeta {
  const workflow = (metadata as { workflow?: Partial<ReportWorkflowMeta> } | null)?.workflow;
  const source = getReportDataSource(workflow?.sourceName ?? getDefaultReportDataSource().key);
  const selectedFields = workflow?.selectedFields?.length
    ? workflow.selectedFields
    : source.defaultFields;
  const layout = workflow?.layout?.length ? normalizeLayout(source.key, workflow.layout) : buildDefaultLayout(source.key, selectedFields);
  const aggregates = buildAggregates(source.key, layout.map((item) => item.field), workflow?.aggregates);
  const parameters = normalizeParameters(workflow?.parameters);
  const filterBy = normalizeFilterBy(workflow?.filterBy);

  return {
    sourceName: source.key,
    filterRule: workflow?.filterRule ?? "status = 'READY' AND printed_at >= today",
    summaryFocus: workflow?.summaryFocus ?? "Ringkasan total halaman, user paling aktif, dan anomali print gagal.",
    outputName: workflow?.outputName ?? "report.pdf",
    orientation: workflow?.orientation === "LANDSCAPE" ? "LANDSCAPE" : "PORTRAIT",
    parameters,
    filterBy,
    selectedFields: Array.from(new Set(layout.map((item) => item.field))),
    nodes: workflow?.nodes ?? [
      { id: "source", label: "Data Source", order: 1 },
      { id: "filter", label: "Filter Rows", order: 2 },
      { id: "summary", label: "Summary Logic", order: 3 },
      { id: "export", label: "Export PDF", order: 4 },
    ],
    layout,
    aggregates,
  };
}

export function getTableFields(workflow: ReportWorkflowMeta) {
  const detailFields = workflow.layout.filter((item) => item.section === "detail").map((item) => item.field);
  return detailFields.length ? detailFields : workflow.selectedFields;
}

export function buildAggregates(sourceName: string, fields: string[], current?: Partial<Record<string, ReportAggregateType>>) {
  return Array.from(new Set(fields)).reduce<Record<string, ReportAggregateType>>((accumulator, field) => {
    const meta = getSourceFieldMeta(sourceName, field);
    accumulator[field] = current?.[field] ?? (meta?.kind === "number" ? "SUM" : "NONE");
    return accumulator;
  }, {});
}

export function calculateAggregateValue(
  sourceName: string,
  field: string,
  aggregate: ReportAggregateType,
  rows: Array<Record<string, string | number>>,
) {
  if (aggregate === "NONE") return "";

  const meta = getSourceFieldMeta(sourceName, field);
  const rawValues = rows.map((row) => row[field]).filter((value) => value !== undefined && value !== null);

  if (aggregate === "COUNT") {
    return rawValues.length;
  }

  if (meta?.kind !== "number") {
    return "";
  }

  const numericValues = rawValues.filter((value): value is number => typeof value === "number");
  if (!numericValues.length) return "";

  switch (aggregate) {
    case "SUM":
      return numericValues.reduce((sum, value) => sum + value, 0);
    case "AVG":
      return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    case "MIN":
      return Math.min(...numericValues);
    case "MAX":
      return Math.max(...numericValues);
    default:
      return "";
  }
}

export function normalizeParameters(parameters?: ReportParameter[]) {
  if (!parameters?.length) {
    return [
      { id: "param-start-date", label: "Dari", value: "01-Mar-26" },
      { id: "param-end-date", label: "s/d", value: "08-Mar-26" },
    ];
  }

  return parameters.map((parameter, index) => ({
    id: parameter.id || `param-${index + 1}`,
    label: parameter.label || `Parameter ${index + 1}`,
    value: parameter.value || "",
  }));
}

export function getSubtitleFromParameters(parameters: ReportParameter[]) {
  if (!parameters.length) return "";
  return parameters
    .filter((parameter) => parameter.label.trim() || parameter.value.trim())
    .map((parameter) => `${parameter.label} ${parameter.value}`.trim())
    .join(" ");
}

export function buildOutputFileName(title: string, parameters: ReportParameter[]) {
  const titlePart = sanitizeFileNamePart(title) || "report";
  const parameterPart = sanitizeFileNamePart(
    parameters
      .filter((parameter) => parameter.label.trim() || parameter.value.trim())
      .map((parameter) => `${parameter.label} ${parameter.value}`.trim())
      .join(" "),
  );

  return parameterPart ? `${titlePart} - ${parameterPart}.pdf` : `${titlePart}.pdf`;
}

function sanitizeFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\./g, "-")
    .replace(/\s*-\s*/g, " - ")
    .trim();
}

export function normalizeFilterBy(filterBy?: Partial<ReportFilterConfig>) {
  return {
    field: filterBy?.field ?? "",
    value: filterBy?.value ?? "",
  };
}

export function applyPreviewFilter(
  rows: Array<Record<string, string | number>>,
  filterBy: ReportFilterConfig,
) {
  if (!filterBy.field || !filterBy.value) return rows;
  return rows.filter((row) => String(row[filterBy.field] ?? "") === filterBy.value);
}

export function groupPreviewRows(
  rows: Array<Record<string, string | number>>,
  filterBy: ReportFilterConfig,
) {
  if (!filterBy.field) {
    return [{ key: "all", label: "", value: "", rows }];
  }

  const grouped = new Map<string, Array<Record<string, string | number>>>();

  rows.forEach((row) => {
    const key = String(row[filterBy.field] ?? "-");
    const existing = grouped.get(key) ?? [];
    existing.push(row);
    grouped.set(key, existing);
  });

  return Array.from(grouped.entries()).map(([value, groupedRows]) => ({
    key: value,
    label: filterBy.field,
    value,
    rows: groupedRows,
  }));
}
