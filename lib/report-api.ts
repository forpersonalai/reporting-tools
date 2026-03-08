import type { Prisma, Report, ReportFileType, ReportStatus } from "@/generated/prisma";

import { prisma } from "@/lib/db";
import { buildReportPdfBytes, generateReportPdf } from "@/lib/report-pdf";
import { reportRequestSchema } from "@/lib/report-schema";
import { buildOutputFileName, normalizeWorkflowMetadata } from "@/lib/report-workflow";
import type { ReportWorkflowMeta } from "@/types";

type SessionUserLike = {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  department?: string | null;
};

type ReportMutationBody = Record<string, unknown>;

export type NormalizedReportPayload = {
  title: string;
  description: string;
  category: string;
  fileType: ReportFileType;
  status: ReportStatus;
  tags: string[];
  metadata: { workflow: ReportWorkflowMeta };
  workflow: ReportWorkflowMeta;
};

export function normalizeReportPayload(body: ReportMutationBody): NormalizedReportPayload {
  const parsed = reportRequestSchema.parse(body);
  const workflow = normalizeWorkflowMetadata(parsed.metadata);

  return {
    title: parsed.title,
    description: parsed.description.trim(),
    category: parsed.category.trim() || "General",
    fileType: parsed.fileType as ReportFileType,
    status: parsed.status as ReportStatus,
    tags: parsed.tags.map((tag) => tag.trim()).filter(Boolean),
    metadata: {
      workflow: {
        ...workflow,
        outputName: workflow.outputName || buildOutputFileName(parsed.title || "report", workflow.parameters),
      },
    },
    workflow,
  };
}

export function buildReportCreateData(payload: NormalizedReportPayload, createdById: string): Prisma.ReportCreateInput {
  return {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    fileUrl: null,
    fileType: payload.fileType,
    status: payload.status,
    tags: JSON.stringify(payload.tags),
    metadata: payload.metadata as unknown as Prisma.InputJsonValue,
    createdBy: {
      connect: {
        id: createdById,
      },
    },
  };
}

export function buildReportUpdateData(payload: NormalizedReportPayload): Prisma.ReportUpdateInput {
  return {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    fileType: payload.fileType,
    status: payload.status,
    tags: JSON.stringify(payload.tags),
    metadata: payload.metadata as unknown as Prisma.InputJsonValue,
  };
}

export async function ensureSessionUser(sessionUser: SessionUserLike) {
  if (!sessionUser.email) {
    return sessionUser.id ?? null;
  }

  const user = await prisma.user.upsert({
    where: { email: sessionUser.email },
    update: {
      name: sessionUser.name ?? "Demo Admin",
      department: sessionUser.department ?? "IT",
    },
    create: {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name ?? "Demo Admin",
      password: "demo-account",
      role: sessionUser.role === "ADMIN" ? "ADMIN" : sessionUser.role === "MANAGER" ? "MANAGER" : "USER",
      department: sessionUser.department ?? "IT",
    },
    select: { id: true },
  });

  return user.id;
}

export async function publishReportPdfForRecord(
  report: Pick<Report, "id" | "title" | "category" | "description" | "metadata">,
  createdByName: string,
) {
  const workflow = normalizeWorkflowMetadata(report.metadata);
  const pdf = await generateReportPdf({
    reportId: report.id,
    title: report.title,
    category: report.category,
    description: report.description ?? "",
    createdByName,
    workflow,
  });

  return prisma.report.update({
    where: { id: report.id },
    data: {
      fileUrl: pdf.publicUrl,
      fileType: "PDF",
      metadata: {
        workflow: {
          ...workflow,
          outputName: workflow.outputName || buildOutputFileName(report.title, workflow.parameters),
        },
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function buildPreviewPdfFile(payload: NormalizedReportPayload, createdByName: string) {
  const fileName = payload.metadata.workflow.outputName || buildOutputFileName(payload.title || "Preview Report", payload.workflow.parameters);
  const pdfBytes = await buildReportPdfBytes({
    reportId: "preview",
    title: payload.title || "Preview Report",
    category: payload.category,
    description: payload.description,
    createdByName,
    workflow: payload.workflow,
  });

  return {
    fileName,
    pdfBytes,
  };
}
