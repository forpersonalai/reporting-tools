"use client";

import { Binary, Database, FileText, Filter, ScanSearch, Sparkles } from "lucide-react";

import { ReportAggregateSection } from "@/components/reports/ReportAggregateSection";
import { ReportDesignerSection } from "@/components/reports/ReportDesignerSection";
import { ReportFilterSection } from "@/components/reports/ReportFilterSection";
import { ReportParametersSection } from "@/components/reports/ReportParametersSection";
import { ReportPreviewCard } from "@/components/reports/ReportPreviewCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReportForm } from "@/hooks/useReportForm";
import { reportDataSources } from "@/lib/report-data-sources";
import type { ReportDetailItem, ReportLayoutSection, ReportStatusType } from "@/types";

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

export function ReportForm({
  mode,
  report,
}: {
  mode: "create" | "edit";
  report?: ReportDetailItem;
}) {
  const {
    values,
    isSubmitting,
    isPreviewingPdf,
    error,
    outputFileName,
    availableFields,
    currentSource,
    filterOptions,
    previewGroups,
    selectedFilterFieldMeta,
    subtitleText,
    tableFields,
    persistedWorkflow,
    updateField,
    updateWorkflowField,
    updateParameter,
    addParameter,
    updateFilterBy,
    removeParameter,
    addSuggestedField,
    handleSourceChange,
    updateAggregate,
    handleDragStart,
    handleDrop,
    handleDragOver,
    toggleFieldSelection,
    removeFieldFromLayout,
    handleSubmit,
    handleLivePreviewPdf,
  } = useReportForm({ mode, report });

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

          <ReportParametersSection
            onAddParameter={addParameter}
            onRemoveParameter={removeParameter}
            onUpdateParameter={updateParameter}
            parameters={values.workflow.parameters}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Nama workflow / laporan</Label>
              <Input id="title" value={values.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Contoh: Rekap Print Harian WPS" />
            </div>
            <ReportFilterSection
              currentSourceDescription={currentSource.description}
              currentSourceFields={currentSource.fields.map((field) => ({ key: field.key, label: field.label }))}
              filterOptions={filterOptions}
              onSourceChange={handleSourceChange}
              onStatusChange={(status) => updateField("status", status as ReportStatusType)}
              onUpdateFilterBy={updateFilterBy}
              onUpdateWorkflowField={updateWorkflowField}
              orientation={values.workflow.orientation}
              sourceName={values.workflow.sourceName}
              sources={reportDataSources.map((source) => ({ key: source.key, label: source.label, tableName: source.tableName }))}
              status={values.status}
              workflow={values.workflow}
            />
            <ReportDesignerSection
              availableFields={availableFields}
              layout={values.workflow.layout}
              onAddSuggestedField={addSuggestedField}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onRemoveFieldFromLayout={removeFieldFromLayout}
              onToggleFieldSelection={toggleFieldSelection}
              sections={sections}
              sourceName={values.workflow.sourceName}
            />
            <ReportAggregateSection
              onUpdateAggregate={updateAggregate}
              sourceName={values.workflow.sourceName}
              tableFields={tableFields}
              values={values.workflow.aggregates}
            />
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
        <ReportPreviewCard
          createdByName={report?.createdBy.name ?? "Demo Admin"}
          isPreviewingPdf={isPreviewingPdf}
          onLivePreviewPdf={handleLivePreviewPdf}
          orientation={persistedWorkflow.orientation}
          outputFileName={outputFileName}
          previewGroups={previewGroups}
          selectedFilterFieldLabel={selectedFilterFieldMeta?.label ?? null}
          sourceName={persistedWorkflow.sourceName}
          subtitleText={subtitleText}
          tableFields={tableFields}
          title={values.title}
        />

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
