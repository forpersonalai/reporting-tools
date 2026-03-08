import { getReportDataSource, getSourceFieldMeta, getSourceSampleRows } from "@/lib/report-data-sources";
import {
  applyPreviewFilter,
  buildAggregates,
  buildDefaultLayout,
  buildOutputFileName,
  calculateAggregateValue,
  getSubtitleFromParameters,
  getTableFields,
  groupPreviewRows,
  normalizeFilterBy,
  normalizeLayout,
  normalizeParameters,
} from "@/lib/report-workflow";
import type { ReportDetailItem, ReportWorkflowMeta } from "@/types";

export type ReportPreviewGroupWithTotals = {
  key: string;
  value: string;
  rows: Array<Record<string, string | number>>;
  totals: Record<string, string | number>;
  totalLabelColSpan: number;
};

export function createDefaultWorkflow(sourceName = "print_logs"): ReportWorkflowMeta {
  const source = getReportDataSource(sourceName);

  return {
    sourceName: source.key,
    filterRule: "status = 'SUCCESS' AND printed_at >= current_date",
    summaryFocus: "Sorot user paling aktif, printer yang sering dipakai, dan status print yang gagal.",
    outputName: "report.pdf",
    orientation: "PORTRAIT",
    parameters: normalizeParameters(),
    filterBy: normalizeFilterBy(),
    selectedFields: source.defaultFields,
    nodes: [
      { id: "source", label: "Data Source", order: 1 },
      { id: "filter", label: "Filter Rows", order: 2 },
      { id: "summary", label: "Summary Logic", order: 3 },
      { id: "export", label: "Export PDF", order: 4 },
    ],
    layout: buildDefaultLayout(source.key, source.defaultFields),
    aggregates: buildAggregates(source.key, source.defaultFields),
  };
}

export function hydrateWorkflowConfig(workflow?: Partial<ReportWorkflowMeta>) {
  const fallbackWorkflow = createDefaultWorkflow(workflow?.sourceName);
  const source = getReportDataSource(workflow?.sourceName ?? fallbackWorkflow.sourceName);

  return {
    sourceName: source.key,
    filterRule: workflow?.filterRule ?? fallbackWorkflow.filterRule,
    summaryFocus: workflow?.summaryFocus ?? fallbackWorkflow.summaryFocus,
    outputName: workflow?.outputName ?? fallbackWorkflow.outputName,
    orientation: workflow?.orientation === "LANDSCAPE" ? "LANDSCAPE" : "PORTRAIT",
    parameters: normalizeParameters(workflow?.parameters),
    filterBy: normalizeFilterBy(workflow?.filterBy),
    selectedFields: workflow?.selectedFields?.length ? workflow.selectedFields : source.defaultFields,
    nodes: workflow?.nodes?.length ? workflow.nodes : fallbackWorkflow.nodes,
    layout: workflow?.layout?.length
      ? normalizeLayout(source.key, workflow.layout)
      : buildDefaultLayout(source.key, workflow?.selectedFields ?? source.defaultFields),
    aggregates: buildAggregates(source.key, workflow?.selectedFields ?? source.defaultFields, workflow?.aggregates),
  } satisfies ReportWorkflowMeta;
}

export function createInitialReportFormValues(report?: ReportDetailItem) {
  if (!report) {
    return {
      title: "",
      description: "",
      category: "",
      status: "DRAFT" as const,
      tags: "",
      workflow: createDefaultWorkflow(),
    };
  }

  return {
    title: report.title,
    description: report.description ?? "",
    category: report.category,
    status: report.status,
    tags: report.tags.join(", "),
    workflow: hydrateWorkflowConfig(report.metadata?.workflow as Partial<ReportWorkflowMeta> | undefined),
  };
}

export function buildPersistedWorkflow(workflow: ReportWorkflowMeta, reportTitle: string) {
  const normalizedParameters = normalizeParameters(workflow.parameters);
  const normalizedLayout = normalizeLayout(workflow.sourceName, workflow.layout);
  const selectedFields = Array.from(new Set(normalizedLayout.map((item) => item.field)));
  const outputFileName = buildOutputFileName(reportTitle || "report", normalizedParameters);

  return {
    outputFileName,
    workflow: {
      ...workflow,
      outputName: outputFileName,
      orientation: workflow.orientation,
      parameters: normalizedParameters,
      filterBy: normalizeFilterBy(workflow.filterBy),
      nodes: workflow.nodes,
      layout: normalizedLayout,
      selectedFields,
      aggregates: buildAggregates(workflow.sourceName, selectedFields, workflow.aggregates),
    } satisfies ReportWorkflowMeta,
  };
}

export function buildReportPreviewState(workflow: ReportWorkflowMeta) {
  const currentSource = getReportDataSource(workflow.sourceName);
  const availableFields = currentSource.fields.map((field) => field.key);
  const tableFields = getTableFields(workflow);
  const rawPreviewRows = getSourceSampleRows(workflow.sourceName);
  const previewRows = applyPreviewFilter(rawPreviewRows, workflow.filterBy);
  const subtitleText = getSubtitleFromParameters(workflow.parameters);
  const selectedFilterFieldMeta = workflow.filterBy.field
    ? getSourceFieldMeta(workflow.sourceName, workflow.filterBy.field)
    : null;
  const filterOptions = workflow.filterBy.field
    ? Array.from(new Set(rawPreviewRows.map((row) => String(row[workflow.filterBy.field] ?? "")))).filter(Boolean)
    : [];

  const previewGroups = groupPreviewRows(previewRows, workflow.filterBy).map<ReportPreviewGroupWithTotals>((group) => {
    const totals = tableFields.reduce<Record<string, string | number>>((accumulator, field) => {
      accumulator[field] = calculateAggregateValue(workflow.sourceName, field, workflow.aggregates[field] ?? "NONE", group.rows);
      return accumulator;
    }, {});
    const firstTotalFieldIndex = tableFields.findIndex((field) => typeof totals[field] === "number");

    return {
      key: group.key,
      value: group.value,
      rows: group.rows,
      totals,
      totalLabelColSpan: firstTotalFieldIndex === -1 ? tableFields.length + 1 : firstTotalFieldIndex + 1,
    };
  });

  return {
    currentSource,
    availableFields,
    tableFields,
    subtitleText,
    selectedFilterFieldMeta,
    filterOptions,
    previewGroups,
  };
}
