"use client";

import { useRouter } from "next/navigation";
import { BadgePlus, Binary, Database, FileText, Filter, GripVertical, Plus, ScanSearch, Sparkles, Trash2 } from "lucide-react";
import { startTransition, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getReportDataSource, getSourceFieldMeta, getSourceSampleRows, reportDataSources } from "@/lib/report-data-sources";
import { applyPreviewFilter, buildAggregates, buildDefaultLayout, buildOutputFileName, calculateAggregateValue, getFieldLabel, getFieldPreviewValue, getSubtitleFromParameters, getTableFields, groupPreviewRows, normalizeFilterBy, normalizeLayout, normalizeParameters } from "@/lib/report-workflow";
import type { ReportAggregateType, ReportDetailItem, ReportLayoutItem, ReportLayoutSection, ReportPageOrientation, ReportParameter, ReportStatusType, ReportWorkflowMeta } from "@/types";

type WorkflowConfig = ReportWorkflowMeta;

type ReportFormValues = {
  title: string;
  description: string;
  category: string;
  status: ReportStatusType;
  tags: string;
  workflow: WorkflowConfig;
};

const defaultSource = getReportDataSource("print_logs");

const defaultValues: ReportFormValues = {
  title: "",
  description: "",
  category: "",
  status: "DRAFT",
  tags: "",
  workflow: {
    sourceName: defaultSource.key,
    filterRule: "status = 'SUCCESS' AND printed_at >= current_date",
    summaryFocus: "Sorot user paling aktif, printer yang sering dipakai, dan status print yang gagal.",
    outputName: "report.pdf",
    orientation: "PORTRAIT",
    parameters: normalizeParameters(),
    filterBy: normalizeFilterBy(),
    selectedFields: defaultSource.defaultFields,
    nodes: [
      { id: "source", label: "Data Source", order: 1 },
      { id: "filter", label: "Filter Rows", order: 2 },
      { id: "summary", label: "Summary Logic", order: 3 },
      { id: "export", label: "Export PDF", order: 4 },
    ],
    layout: buildDefaultLayout(defaultSource.key, defaultSource.defaultFields),
    aggregates: buildAggregates(defaultSource.key, defaultSource.defaultFields),
  },
};

const categories = ["Kayu Bulat", "Kayu Bulat (Rambung)", "Sawn Timber", "Broker", "Mixer", "Furniture WIP"];

const workflowNodes = [
  {
    key: "source",
    title: "Data Source",
    description: "Pilih tabel database yang ingin dipakai sebagai basis laporan.",
    icon: Database,
    tone: "bg-primary/10 text-primary border-primary/20",
  },
  {
    key: "filter",
    title: "Filter Rows",
    description: "Saring record yang akan muncul di report.",
    icon: Filter,
    tone: "bg-secondary text-secondary-foreground border-border",
  },
  {
    key: "summary",
    title: "Summary Logic",
    description: "Atur ringkasan insight yang ditampilkan di PDF.",
    icon: ScanSearch,
    tone: "bg-accent text-accent-foreground border-border",
  },
  {
    key: "export",
    title: "Export PDF",
    description: "Output akhir selalu satu file PDF dengan nama otomatis.",
    icon: FileText,
    tone: "bg-primary text-primary-foreground border-primary/40",
  },
];

const sections: Array<{ key: ReportLayoutSection; title: string; description: string }> = [
  { key: "title", title: "Title Band", description: "Field yang tampil di header report." },
  { key: "columnHeader", title: "Column Header", description: "Kolom yang menjadi kepala tabel." },
  { key: "detail", title: "Detail Band", description: "Baris data utama yang diulang." },
  { key: "summary", title: "Summary Band", description: "KPI, total, atau insight penutup." },
];

function normalizeInitial(report?: ReportDetailItem): ReportFormValues {
  if (!report) return defaultValues;

  const workflow = (report.metadata?.workflow as Partial<WorkflowConfig> | undefined) ?? {};
  const sourceName = workflow.sourceName ?? defaultValues.workflow.sourceName;
  const source = getReportDataSource(sourceName);

  return {
    title: report.title,
    description: report.description ?? "",
    category: report.category,
    status: report.status,
    tags: report.tags.join(", "),
    workflow: {
      sourceName: source.key,
      filterRule: workflow.filterRule ?? defaultValues.workflow.filterRule,
      summaryFocus: workflow.summaryFocus ?? defaultValues.workflow.summaryFocus,
      outputName: "report.pdf",
      orientation: workflow.orientation === "LANDSCAPE" ? "LANDSCAPE" : "PORTRAIT",
      parameters: normalizeParameters(workflow.parameters),
      filterBy: normalizeFilterBy(workflow.filterBy),
      selectedFields: workflow.selectedFields?.length ? workflow.selectedFields : source.defaultFields,
      nodes: workflow.nodes?.length ? workflow.nodes : defaultValues.workflow.nodes,
      layout: workflow.layout?.length
        ? normalizeLayout(source.key, workflow.layout)
        : buildDefaultLayout(source.key, workflow.selectedFields ?? source.defaultFields),
      aggregates: buildAggregates(source.key, workflow.selectedFields ?? source.defaultFields, workflow.aggregates),
    },
  };
}

export function ReportForm({
  mode,
  report,
}: {
  mode: "create" | "edit";
  report?: ReportDetailItem;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ReportFormValues>(() => normalizeInitial(report));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSource = getReportDataSource(values.workflow.sourceName);
  const availableFields = currentSource.fields.map((field) => field.key);
  const tableFields = getTableFields(values.workflow);
  const rawPreviewRows = getSourceSampleRows(values.workflow.sourceName);
  const previewRows = applyPreviewFilter(rawPreviewRows, values.workflow.filterBy);
  const subtitleText = getSubtitleFromParameters(values.workflow.parameters);
  const selectedFilterFieldMeta = values.workflow.filterBy.field
    ? getSourceFieldMeta(values.workflow.sourceName, values.workflow.filterBy.field)
    : null;
  const filterOptions = values.workflow.filterBy.field
    ? Array.from(new Set(rawPreviewRows.map((row) => String(row[values.workflow.filterBy.field] ?? "")))).filter(Boolean)
    : [];
  const previewGroups = groupPreviewRows(previewRows, values.workflow.filterBy);
  const normalizedParameters = normalizeParameters(values.workflow.parameters);
  const outputFileName = buildOutputFileName(values.title || "report", normalizedParameters);

  function updateField<K extends keyof ReportFormValues>(key: K, value: ReportFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateWorkflowField<K extends keyof WorkflowConfig>(key: K, value: WorkflowConfig[K]) {
    setValues((current) => ({
      ...current,
      workflow: {
        ...current.workflow,
        [key]: value,
      },
    }));
  }

  function updateParameter(parameterId: string, key: keyof ReportParameter, value: string) {
    setValues((current) => ({
      ...current,
      workflow: {
        ...current.workflow,
        parameters: current.workflow.parameters.map((parameter) =>
          parameter.id === parameterId ? { ...parameter, [key]: value } : parameter,
        ),
      },
    }));
  }

  function addParameter() {
    setValues((current) => ({
      ...current,
      workflow: {
        ...current.workflow,
        parameters: [
          ...current.workflow.parameters,
          {
            id: `param-${crypto.randomUUID()}`,
            label: `Label ${current.workflow.parameters.length + 1}`,
            value: "",
          },
        ],
      },
    }));
  }

  function updateFilterBy(key: "field" | "value", value: string) {
    setValues((current) => ({
      ...current,
      workflow: {
        ...current.workflow,
        filterBy: {
          ...current.workflow.filterBy,
          [key]: value,
        },
      },
    }));
  }

  function removeParameter(parameterId: string) {
    setValues((current) => ({
      ...current,
      workflow: {
        ...current.workflow,
        parameters: current.workflow.parameters.filter((parameter) => parameter.id !== parameterId),
      },
    }));
  }

  function syncLayout(sourceName: string, layout: ReportLayoutItem[]) {
    const normalized = normalizeLayout(sourceName, layout);
    setValues((current) => ({
      ...current,
      workflow: {
        ...current.workflow,
        layout: normalized,
        selectedFields: Array.from(new Set(normalized.map((item) => item.field))),
        aggregates: buildAggregates(sourceName, normalized.map((item) => item.field), current.workflow.aggregates),
      },
    }));
  }

  function placeFieldInSection(field: string, section: ReportLayoutSection) {
    const existing = values.workflow.layout.filter((item) => item.field !== field);
    const nextLayout = [
      ...existing,
      {
        field,
        label: getFieldLabel(values.workflow.sourceName, field),
        section,
        order: existing.filter((item) => item.section === section).length + 1,
      },
    ];
    syncLayout(values.workflow.sourceName, nextLayout);
  }

  function removeFieldFromLayout(field: string) {
    syncLayout(
      values.workflow.sourceName,
      values.workflow.layout.filter((item) => item.field !== field),
    );
  }

  function addSuggestedField(field: string) {
    if (values.workflow.layout.some((item) => item.field === field)) return;
    placeFieldInSection(field, "detail");
  }

  function handleSourceChange(sourceName: string) {
    const source = getReportDataSource(sourceName);
    const layout = buildDefaultLayout(source.key, source.defaultFields);

    setValues((current) => ({
      ...current,
      workflow: {
        ...current.workflow,
        sourceName: source.key,
        layout,
        filterBy: normalizeFilterBy(),
        selectedFields: Array.from(new Set(layout.map((item) => item.field))),
        aggregates: buildAggregates(source.key, layout.map((item) => item.field)),
      },
    }));
  }

  function updateAggregate(field: string, aggregate: ReportAggregateType) {
    setValues((current) => ({
      ...current,
      workflow: {
        ...current.workflow,
        aggregates: {
          ...current.workflow.aggregates,
          [field]: aggregate,
        },
      },
    }));
  }

  function handleDragStart(event: React.DragEvent<HTMLDivElement>, field: string) {
    event.dataTransfer.setData("text/plain", field);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, section: ReportLayoutSection) {
    event.preventDefault();
    const field = event.dataTransfer.getData("text/plain");
    if (!field) return;
    placeFieldInSection(field, section);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function toggleFieldSelection(field: string) {
    setValues((current) => {
      const exists = current.workflow.layout.some((item) => item.field === field);
      if (exists) {
        const nextLayout = current.workflow.layout.filter((item) => item.field !== field);
        return {
          ...current,
          workflow: {
            ...current.workflow,
            layout: normalizeLayout(current.workflow.sourceName, nextLayout),
            selectedFields: Array.from(new Set(nextLayout.map((item) => item.field))),
          },
        };
      }

      const nextLayout = [
        ...current.workflow.layout,
        {
          field,
          label: getFieldLabel(current.workflow.sourceName, field),
          section: "detail" as ReportLayoutSection,
          order: current.workflow.layout.filter((item) => item.section === "detail").length + 1,
        },
      ];

      return {
        ...current,
        workflow: {
          ...current.workflow,
          layout: normalizeLayout(current.workflow.sourceName, nextLayout),
          selectedFields: Array.from(new Set(nextLayout.map((item) => item.field))),
        },
      };
    });
  }

  async function handleSubmit(nextStatus?: ReportStatusType) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!values.workflow.selectedFields.length) {
        throw new Error("Pilih minimal satu field untuk dimasukkan ke file PDF.");
      }

      const payload = {
        title: values.title,
        description: values.description,
        category: values.category || "General",
        fileType: "PDF",
        fileUrl: outputFileName,
        status: nextStatus ?? values.status,
        tags: values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        metadata: {
          builder: "jasper-lite",
          workflow: {
            ...values.workflow,
            outputName: outputFileName,
            orientation: values.workflow.orientation,
            parameters: normalizedParameters,
            filterBy: normalizeFilterBy(values.workflow.filterBy),
            nodes: values.workflow.nodes,
            layout: normalizeLayout(values.workflow.sourceName, values.workflow.layout),
            selectedFields: Array.from(new Set(values.workflow.layout.map((item) => item.field))),
            aggregates: buildAggregates(values.workflow.sourceName, values.workflow.layout.map((item) => item.field), values.workflow.aggregates),
          },
        },
      };

      const response = await fetch(mode === "create" ? "/api/reports" : `/api/reports/${report?.id}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        data?: { id: string };
        error?: { message?: string };
      };

      if (!response.ok || !result.success || !result.data?.id) {
        throw new Error(result.error?.message ?? "Gagal menyimpan laporan.");
      }

      const nextReportId = result.data.id;

      startTransition(() => {
        router.push(`/reports/${nextReportId}`);
        router.refresh();
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Gagal menyimpan laporan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLivePreviewPdf() {
    setIsPreviewingPdf(true);
    setError(null);

    try {
      const payload = {
        title: values.title || "Judul Laporan",
        category: values.category || "General",
        description: values.description,
        metadata: {
          workflow: {
            ...values.workflow,
            outputName: outputFileName,
            orientation: values.workflow.orientation,
            parameters: normalizedParameters,
            filterBy: normalizeFilterBy(values.workflow.filterBy),
            nodes: values.workflow.nodes,
            layout: normalizeLayout(values.workflow.sourceName, values.workflow.layout),
            selectedFields: Array.from(new Set(values.workflow.layout.map((item) => item.field))),
            aggregates: buildAggregates(
              values.workflow.sourceName,
              values.workflow.layout.map((item) => item.field),
              values.workflow.aggregates,
            ),
          },
        },
      };

      const response = await fetch("/api/reports/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Gagal membuat live preview PDF.");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Gagal membuat live preview PDF.");
    } finally {
      setIsPreviewingPdf(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="gap-2">
              <Binary className="h-3.5 w-3.5" />
              Jasper Lite Designer
            </Badge>
            <Badge variant="outline">Output: {outputFileName}</Badge>
          </div>
          <CardTitle className="mt-2">{mode === "create" ? "Pilih tabel database lalu susun report" : "Edit layout laporan"}</CardTitle>
          <CardDescription>Pola yang lebih mudah dipahami: pilih tabel dahulu, muat kolomnya, lalu drag field ke layout bands seperti JasperReports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-4">
            {workflowNodes.map((node, index) => {
              const Icon = node.icon;

              return (
                <div key={node.key} className="relative">
                  {index < workflowNodes.length - 1 ? (
                    <div className="absolute top-1/2 left-[calc(100%-8px)] hidden h-px w-8 -translate-y-1/2 bg-border lg:block" />
                  ) : null}
                  <div className={`rounded-3xl border p-4 ${node.tone}`}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-background/70 p-2 text-foreground shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{node.title}</p>
                        <p className="mt-1 text-xs opacity-80">{node.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 rounded-3xl border border-border bg-background/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Custom Parameters</p>
                <p className="mt-1 text-xs text-muted-foreground">Parameter ini akan ditampilkan di bawah judul laporan dan nantinya bisa dipakai untuk query database.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addParameter}>
                <Plus className="h-4 w-4" />
                Tambah Parameter
              </Button>
            </div>
            <div className="grid gap-3">
              {values.workflow.parameters.map((parameter) => (
                <div key={parameter.id} className="grid gap-3 rounded-2xl border border-border bg-card/70 p-3 md:grid-cols-[0.9fr_1.1fr_auto]">
                  <div className="space-y-2">
                    <Label htmlFor={`label-${parameter.id}`}>Label</Label>
                    <Input id={`label-${parameter.id}`} value={parameter.label} onChange={(event) => updateParameter(parameter.id, "label", event.target.value)} placeholder="Contoh: Dari" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`value-${parameter.id}`}>Value</Label>
                    <Input id={`value-${parameter.id}`} value={parameter.value} onChange={(event) => updateParameter(parameter.id, "value", event.target.value)} placeholder="Contoh: 01-Mar-26" />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeParameter(parameter.id)} disabled={values.workflow.parameters.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Nama workflow / laporan</Label>
              <Input id="title" value={values.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Contoh: Rekap Print Harian WPS" />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={values.category} onValueChange={(value) => updateField("category", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori laporan" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Node 1: Data source</Label>
              <Select value={values.workflow.sourceName} onValueChange={handleSourceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tabel database" />
                </SelectTrigger>
                <SelectContent>
                  {reportDataSources.map((source) => (
                    <SelectItem key={source.key} value={source.key}>
                      {source.label} ({source.tableName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{currentSource.description}</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={values.status} onValueChange={(value) => updateField("status", value as ReportStatusType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                  <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="filterRule">Node 2: Filter rows</Label>
              <Textarea
                id="filterRule"
                value={values.workflow.filterRule}
                onChange={(event) => updateWorkflowField("filterRule", event.target.value)}
                placeholder="Contoh: status = 'SUCCESS' AND printed_at >= current_date"
              />
            </div>
            <div className="space-y-3 md:col-span-2">
              <Label>Filter By</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Field</Label>
                  <Select
                    value={values.workflow.filterBy.field || "__none"}
                    onValueChange={(value) =>
                      updateFilterBy("field", value === "__none" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih field untuk filter preview" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Tanpa filter</SelectItem>
                      {currentSource.fields.map((field) => (
                        <SelectItem key={`filter-field-${field.key}`} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Select
                    value={values.workflow.filterBy.value || "__none"}
                    onValueChange={(value) =>
                      updateFilterBy("value", value === "__none" ? "" : value)
                    }
                    disabled={!values.workflow.filterBy.field}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih nilai filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Semua nilai</SelectItem>
                      {filterOptions.map((option) => (
                        <SelectItem key={`filter-value-${option}`} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Pilih field untuk membagi output menjadi beberapa tabel per nilai field. Jika value juga dipilih, hanya grup tersebut yang ditampilkan.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="summaryFocus">Node 3: Summary logic</Label>
              <Textarea
                id="summaryFocus"
                value={values.workflow.summaryFocus}
                onChange={(event) => updateWorkflowField("summaryFocus", event.target.value)}
                placeholder="Fokus insight yang ingin muncul di PDF."
              />
            </div>
            <div className="space-y-2">
              <Label>Orientasi kertas</Label>
              <Select
                value={values.workflow.orientation}
                onValueChange={(value) => updateWorkflowField("orientation", value as ReportPageOrientation)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih orientasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PORTRAIT">Portrait</SelectItem>
                  <SelectItem value="LANDSCAPE">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 md:col-span-2">
              <Label>Node 4: Report designer</Label>
              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-border bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Field Library</p>
                      <p className="mt-1 text-xs text-muted-foreground">Kolom diambil dari tabel database yang dipilih.</p>
                    </div>
                    <Badge variant="secondary">{values.workflow.selectedFields.length} field aktif</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {availableFields.map((field) => {
                      const exists = values.workflow.layout.some((item) => item.field === field);

                      return (
                        <div
                          key={field}
                          draggable
                          onDragStart={(event) => handleDragStart(event, field)}
                          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{getFieldLabel(values.workflow.sourceName, field)}</p>
                            <p className="truncate text-xs text-muted-foreground">{getFieldPreviewValue(values.workflow.sourceName, field)}</p>
                          </div>
                          {exists ? (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFieldFromLayout(field)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button type="button" variant="ghost" size="icon" onClick={() => addSuggestedField(field)}>
                              <BadgePlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-background/60 p-4">
                  <div>
                    <p className="text-sm font-semibold">Layout Bands</p>
                    <p className="mt-1 text-xs text-muted-foreground">Drop kolom ke band yang sesuai. Field library langsung mengikuti tabel yang dipilih.</p>
                  </div>
                  <div className="mt-4 space-y-4">
                    {sections.map((section) => {
                      const items = values.workflow.layout.filter((item) => item.section === section.key);

                      return (
                        <div
                          key={section.key}
                          onDrop={(event) => handleDrop(event, section.key)}
                          onDragOver={handleDragOver}
                          className="rounded-3xl border border-dashed border-border bg-card/70 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{section.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
                            </div>
                            <Badge variant="outline">{items.length} item</Badge>
                          </div>
                          <div className="mt-3 space-y-2">
                            {items.length === 0 ? (
                              <div className="rounded-2xl bg-secondary/50 px-3 py-4 text-sm text-muted-foreground">Drop field di sini</div>
                            ) : (
                              items.map((item) => (
                                <div key={`${section.key}-${item.field}`} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{item.label}</p>
                                    <p className="truncate text-xs text-muted-foreground">{getFieldPreviewValue(values.workflow.sourceName, item.field)}</p>
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFieldFromLayout(item.field)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableFields.map((field) => {
                  const selected = values.workflow.layout.some((item) => item.field === field);

                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => toggleFieldSelection(field)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {getFieldLabel(values.workflow.sourceName, field)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3 md:col-span-2">
              <Label>Total Row Rules</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {tableFields.map((field) => {
                  const meta = getSourceFieldMeta(values.workflow.sourceName, field);
                  if (!meta || (meta.kind !== "number" && meta.kind !== undefined)) {
                    return null;
                  }

                  return (
                    <div key={`agg-${field}`} className="rounded-2xl border border-border bg-background/60 p-3">
                      <p className="text-sm font-semibold">{meta.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Tentukan perhitungan untuk baris total.</p>
                      <Select value={values.workflow.aggregates[field] ?? "NONE"} onValueChange={(value) => updateAggregate(field, value as ReportAggregateType)}>
                        <SelectTrigger className="mt-3 w-full">
                          <SelectValue placeholder="Pilih aggregate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">None</SelectItem>
                          <SelectItem value="SUM">Sum</SelectItem>
                          <SelectItem value="AVG">Average</SelectItem>
                          <SelectItem value="COUNT">Count</SelectItem>
                          <SelectItem value="MIN">Min</SelectItem>
                          <SelectItem value="MAX">Max</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Catatan laporan</Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Konteks bisnis, tujuan laporan, atau instruksi untuk pengguna lain."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={values.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="print, harian, pdf" />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={isSubmitting} onClick={() => handleSubmit("DRAFT")}>
              {isSubmitting && mode === "create" ? "Menyimpan..." : "Simpan workflow"}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => handleSubmit("PUBLISHED")}>
              {isSubmitting ? "Memproses..." : mode === "create" ? "Publish PDF" : "Simpan perubahan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Preview Output</CardTitle>
            <CardDescription>Preview sekarang mengikuti format laporan tabel seperti template HTML Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Output file</p>
                    <p className="text-lg font-semibold break-all">{outputFileName}</p>
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleLivePreviewPdf} disabled={isPreviewingPdf}>
                  {isPreviewingPdf ? "Membuat preview..." : "Live Preview PDF"}
                </Button>
              </div>
            </div>
            <div
              className={`report-preview-page rounded-[20px] border border-zinc-300 bg-[#f3f4f6] p-4 shadow-sm dark:bg-[#f3f4f6] ${
                values.workflow.orientation === "LANDSCAPE" ? "overflow-x-auto" : ""
              }`}
            >
              <div
                className={`mx-auto bg-white px-6 py-7 text-[9px] leading-[1.15] text-black shadow-[0_0_0_1px_rgba(0,0,0,0.12)] ${
                  values.workflow.orientation === "LANDSCAPE"
                    ? "aspect-[297/210] min-w-[820px]"
                    : "aspect-[210/297] w-full max-w-[595px]"
                }`}
              >
                <h1 className="report-preview-text text-center text-[13px] font-bold">{values.title || "Judul Laporan"}</h1>
                <p className="report-preview-text mt-1 text-center text-[8px] text-zinc-600">{subtitleText || "Tambahkan parameter untuk subtitle laporan"}</p>

                <div className="mt-3 space-y-5">
                {previewGroups.map((group) => {
                  const groupTotals = tableFields.reduce<Record<string, string | number>>((accumulator, field) => {
                    accumulator[field] = calculateAggregateValue(
                      values.workflow.sourceName,
                      field,
                      values.workflow.aggregates[field] ?? "NONE",
                      group.rows,
                    );
                    return accumulator;
                  }, {});
                  const firstTotalFieldIndex = tableFields.findIndex((field) => typeof groupTotals[field] === "number");
                  const totalLabelColSpan = firstTotalFieldIndex === -1 ? tableFields.length + 1 : firstTotalFieldIndex + 1;

                  return (
                    <div key={`preview-group-${group.key}`} className="space-y-1.5">
                      {selectedFilterFieldMeta ? (
                        <p className="report-preview-text text-left text-[9px] font-bold text-black">
                          {selectedFilterFieldMeta.label} : {group.value}
                        </p>
                      ) : null}

                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed border-collapse border border-black">
                          <thead className="table-header-group">
                            <tr>
                              <th className="report-preview-text report-preview-number w-9 border border-black px-1 py-[3px] text-center text-[8px] font-bold">No</th>
                              {tableFields.map((field) => (
                                <th key={`th-${group.key}-${field}`} className="report-preview-text border border-black px-1 py-[3px] text-center text-[8px] font-bold leading-tight">
                                  {getFieldLabel(values.workflow.sourceName, field)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.rows.map((row, index) => (
                              <tr key={`row-${group.key}-${index}`} className={index % 2 === 0 ? "bg-[#d4dbe6]" : "bg-[#eef2f7]"}>
                                <td className="report-preview-number border border-black px-1 py-[2px] text-center align-middle">{index + 1}</td>
                                {tableFields.map((field) => {
                                  const meta = getSourceFieldMeta(values.workflow.sourceName, field);
                                  const value = row[field];
                                  const cellClass =
                                    meta?.kind === "number"
                                      ? "report-preview-number text-right"
                                      : meta?.align === "center"
                                        ? "report-preview-text text-center"
                                        : "report-preview-text text-left";

                                  return (
                                    <td key={`cell-${group.key}-${index}-${field}`} className={`border border-black px-1 py-[2px] align-middle ${cellClass}`}>
                                      {typeof value === "number" ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(value ?? "")}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            {group.rows.length > 0 ? (
                              <tr className="bg-white text-[8px] font-bold">
                                <td colSpan={totalLabelColSpan} className="report-preview-text border border-black px-1 py-[2px] text-center">
                                  Total
                                </td>
                                {firstTotalFieldIndex === -1
                                  ? null
                                  : tableFields.slice(firstTotalFieldIndex).map((field, index) => {
                                      const meta = getSourceFieldMeta(values.workflow.sourceName, field);
                                      const total = groupTotals[field];
                                      return (
                                        <td key={`total-${group.key}-${field}-${index}`} className={`border border-black px-1 py-[2px] ${meta?.kind === "number" ? "report-preview-number text-right" : "report-preview-text text-center"}`}>
                                          {typeof total === "number"
                                            ? total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : ""}
                                        </td>
                                      );
                                    })}
                              </tr>
                            ) : (
                              <tr>
                                <td colSpan={tableFields.length + 1} className="border border-black px-1 py-2 text-center text-[8px]">
                                  Tidak ada data.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                </div>

                <div className="report-preview-text mt-4 flex items-end justify-between text-[7px] italic text-zinc-600">
                  <div>Dicetak oleh {report?.createdBy.name ?? "Demo Admin"} pada 08-Mar-26 05:30</div>
                  <div>Halaman 1 dari 1</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kenapa pola ini lebih mudah</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="font-medium text-foreground">Mulai dari tabel database</p>
              <p className="mt-1">User langsung paham sumber data apa yang sedang dipakai sebelum menyusun layout report.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="font-medium text-foreground">Field library selalu relevan</p>
              <p className="mt-1">Kolom di kiri berubah sesuai tabel yang dipilih, jadi tidak ada field statis yang membingungkan.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="font-medium text-foreground">Masih familiar seperti JasperReports</p>
              <p className="mt-1">Layout tetap memakai band `Title`, `Column Header`, `Detail`, dan `Summary` dengan drag-and-drop.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Ini memberi flow yang lebih natural: pilih tabel, pilih kolom, susun layout, lalu publish PDF.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
