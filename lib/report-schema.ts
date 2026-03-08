import { z } from "zod";

const reportStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const reportFileTypeValues = ["PDF", "EXCEL", "WORD", "CSV", "HTML"] as const;
const reportOrientationValues = ["PORTRAIT", "LANDSCAPE"] as const;
const reportLayoutSectionValues = ["title", "columnHeader", "detail", "summary"] as const;
const reportAggregateValues = ["NONE", "SUM", "AVG", "COUNT", "MIN", "MAX"] as const;

export const reportParameterSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  value: z.string(),
});

export const reportFilterConfigSchema = z.object({
  field: z.string(),
  value: z.string(),
});

export const workflowNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.number().int().nonnegative(),
});

export const reportLayoutItemSchema = z.object({
  field: z.string().min(1),
  label: z.string().min(1),
  section: z.enum(reportLayoutSectionValues),
  order: z.number().int().positive(),
});

export const reportWorkflowSchema = z.object({
  sourceName: z.string().min(1),
  filterRule: z.string(),
  summaryFocus: z.string(),
  outputName: z.string().min(1),
  orientation: z.enum(reportOrientationValues),
  parameters: z.array(reportParameterSchema),
  filterBy: reportFilterConfigSchema,
  selectedFields: z.array(z.string().min(1)),
  nodes: z.array(workflowNodeSchema),
  layout: z.array(reportLayoutItemSchema),
  aggregates: z.record(z.string(), z.enum(reportAggregateValues)),
});

export const reportMetadataSchema = z.object({
  builder: z.string().optional(),
  workflow: reportWorkflowSchema,
});

export const reportRequestSchema = z.object({
  title: z.string().trim().min(1, "Nama laporan wajib diisi."),
  description: z.string().default(""),
  category: z.string().trim().min(1).default("General"),
  fileType: z.enum(reportFileTypeValues).default("PDF"),
  fileUrl: z.string().optional(),
  status: z.enum(reportStatusValues).default("DRAFT"),
  tags: z.array(z.string()).default([]),
  metadata: reportMetadataSchema,
});

export type ReportRequestInput = z.infer<typeof reportRequestSchema>;
