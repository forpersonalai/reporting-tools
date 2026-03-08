"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { ZodError } from "zod";

import {
  buildPersistedWorkflow,
  buildReportPreviewState,
  createInitialReportFormValues,
} from "@/lib/report-builder";
import { getReportDataSource } from "@/lib/report-data-sources";
import { reportRequestSchema } from "@/lib/report-schema";
import { buildAggregates, buildDefaultLayout, getFieldLabel, normalizeFilterBy, normalizeLayout } from "@/lib/report-workflow";
import type {
  ReportAggregateType,
  ReportDetailItem,
  ReportLayoutItem,
  ReportLayoutSection,
  ReportParameter,
  ReportStatusType,
  ReportWorkflowMeta,
} from "@/types";

export type ReportFormValues = {
  title: string;
  description: string;
  category: string;
  status: ReportStatusType;
  tags: string;
  workflow: ReportWorkflowMeta;
};

export function useReportForm({
  mode,
  report,
}: {
  mode: "create" | "edit";
  report?: ReportDetailItem;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ReportFormValues>(() => createInitialReportFormValues(report));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { workflow: persistedWorkflow, outputFileName } = buildPersistedWorkflow(values.workflow, values.title || "report");
  const {
    availableFields,
    currentSource,
    filterOptions,
    previewGroups,
    selectedFilterFieldMeta,
    subtitleText,
    tableFields,
  } = buildReportPreviewState(persistedWorkflow);

  function updateField<K extends keyof ReportFormValues>(key: K, value: ReportFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateWorkflowField<K extends keyof ReportWorkflowMeta>(key: K, value: ReportWorkflowMeta[K]) {
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

      const payload = reportRequestSchema.parse({
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
          workflow: persistedWorkflow,
        },
      });

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
      if (submissionError instanceof ZodError) {
        setError(submissionError.issues[0]?.message ?? "Payload laporan tidak valid.");
      } else {
        setError(submissionError instanceof Error ? submissionError.message : "Gagal menyimpan laporan.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLivePreviewPdf() {
    setIsPreviewingPdf(true);
    setError(null);

    try {
      const payload = reportRequestSchema.parse({
        title: values.title || "Judul Laporan",
        category: values.category || "General",
        description: values.description,
        fileType: "PDF",
        status: values.status,
        tags: values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        metadata: {
          workflow: persistedWorkflow,
        },
      });

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
      if (previewError instanceof ZodError) {
        setError(previewError.issues[0]?.message ?? "Payload preview PDF tidak valid.");
      } else {
        setError(previewError instanceof Error ? previewError.message : "Gagal membuat live preview PDF.");
      }
    } finally {
      setIsPreviewingPdf(false);
    }
  }

  return {
    values,
    setValues,
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
  };
}
