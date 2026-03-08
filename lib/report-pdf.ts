import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { ReportWorkflowMeta } from "@/types";
import { getSourceFieldMeta, getSourceSampleRows } from "@/lib/report-data-sources";
import { applyPreviewFilter, buildOutputFileName, calculateAggregateValue, getFieldLabel, getSubtitleFromParameters, getTableFields, groupPreviewRows } from "@/lib/report-workflow";

export type PdfReportInput = {
  reportId: string;
  title: string;
  category: string;
  description: string;
  createdByName: string;
  workflow: ReportWorkflowMeta;
};

export async function buildReportPdfBytes(input: PdfReportInput) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const pageSize: [number, number] =
    input.workflow.orientation === "LANDSCAPE" ? [841.89, 595.28] : [595.28, 841.89];
  const page = pdf.addPage(pageSize);
  const { serifRegular, serifBold, numberRegular, numberBold } = await loadReportFonts(pdf);

  const titleColor = rgb(0, 0, 0);
  const muted = rgb(90 / 255, 94 / 255, 102 / 255);
  const lightRow = rgb(238 / 255, 242 / 255, 247 / 255);
  const darkRow = rgb(212 / 255, 219 / 255, 230 / 255);

  const tableFields = getTableFields(input.workflow);
  const rawPreviewRows = getSourceSampleRows(input.workflow.sourceName);
  const previewRows = applyPreviewFilter(rawPreviewRows, input.workflow.filterBy);
  const subtitleText = getSubtitleFromParameters(input.workflow.parameters);
  const filterFieldMeta = input.workflow.filterBy.field
    ? getSourceFieldMeta(input.workflow.sourceName, input.workflow.filterBy.field)
    : null;
  const previewGroups = groupPreviewRows(previewRows, input.workflow.filterBy);

  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const marginX = 28;
  const titleWidth = serifBold.widthOfTextAtSize(input.title, 13);
  page.drawText(input.title, {
    x: Math.max(marginX, (pageWidth - titleWidth) / 2),
    y: pageHeight - 46,
    size: 13,
    font: serifBold,
    color: titleColor,
  });

  const subtitleDisplay = subtitleText || " ";
  const subtitleWidth = serifRegular.widthOfTextAtSize(subtitleDisplay, 8);
  page.drawText(subtitleDisplay, {
    x: Math.max(marginX, (pageWidth - subtitleWidth) / 2),
    y: pageHeight - 58,
    size: 8,
    font: serifRegular,
    color: muted,
    maxWidth: pageWidth - marginX * 2,
  });

  const tableX = marginX;
  const tableWidth = pageWidth - marginX * 2;
  const numberColWidth = 18;
  const columnWidth = (tableWidth - numberColWidth) / Math.max(tableFields.length, 1);
  const rowHeight = 14;
  let currentY = pageHeight - 86;

  previewGroups.forEach((group, groupIndex) => {
    if (filterFieldMeta) {
      page.drawText(`${filterFieldMeta.label} : ${group.value}`, {
        x: tableX,
        y: currentY,
        size: 8,
        font: serifBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 12;
    }

    page.drawRectangle({ x: tableX, y: currentY, width: numberColWidth, height: rowHeight, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText("No", { x: tableX + 4, y: currentY + 4, size: 6.8, font: numberBold, color: rgb(0, 0, 0) });

    tableFields.forEach((field, index) => {
      const x = tableX + numberColWidth + index * columnWidth;
      page.drawRectangle({ x, y: currentY, width: columnWidth, height: rowHeight, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
      page.drawText(getFieldLabel(input.workflow.sourceName, field), {
        x: x + 2,
        y: currentY + 4,
        size: 6.2,
        font: serifBold,
        color: rgb(0, 0, 0),
        maxWidth: columnWidth - 4,
      });
    });

    currentY -= rowHeight;

    group.rows.forEach((row, rowIndex) => {
      const rowColor = rowIndex % 2 === 0 ? darkRow : lightRow;
      page.drawRectangle({ x: tableX, y: currentY, width: numberColWidth, height: rowHeight, color: rowColor, borderColor: rgb(0, 0, 0), borderWidth: 1 });
      page.drawText(String(rowIndex + 1), { x: tableX + 5, y: currentY + 4, size: 6.2, font: numberRegular, color: rgb(0, 0, 0) });

      tableFields.forEach((field, index) => {
        const x = tableX + numberColWidth + index * columnWidth;
        const meta = getSourceFieldMeta(input.workflow.sourceName, field);
        const value = row[field];
        const text = typeof value === "number" ? value.toFixed(2) : String(value ?? "");
        const font = meta?.kind === "number" ? numberRegular : serifRegular;
        const textWidth = font.widthOfTextAtSize(text, 5.9);
        const textX = meta?.kind === "number" ? Math.max(x + 2, x + columnWidth - textWidth - 2) : x + 2;
        page.drawRectangle({ x, y: currentY, width: columnWidth, height: rowHeight, color: rowColor, borderColor: rgb(0, 0, 0), borderWidth: 1 });
        page.drawText(text, { x: textX, y: currentY + 4, size: 5.9, font, color: rgb(0, 0, 0), maxWidth: columnWidth - 4 });
      });

      currentY -= rowHeight;
    });

    const totals = tableFields.reduce<Record<string, string | number>>((accumulator, field) => {
      accumulator[field] = calculateAggregateValue(input.workflow.sourceName, field, input.workflow.aggregates[field] ?? "NONE", group.rows);
      return accumulator;
    }, {});
    const firstTotalFieldIndex = tableFields.findIndex((field) => typeof totals[field] === "number");
    const totalLabelWidth =
      firstTotalFieldIndex === -1
        ? numberColWidth + columnWidth * tableFields.length
        : numberColWidth + columnWidth * firstTotalFieldIndex;

    page.drawRectangle({ x: tableX, y: currentY, width: totalLabelWidth, height: rowHeight, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText("Total", { x: tableX + 9, y: currentY + 4, size: 6.6, font: serifBold, color: rgb(0, 0, 0) });

    if (firstTotalFieldIndex !== -1) {
      tableFields.slice(firstTotalFieldIndex).forEach((field, index) => {
        const x = tableX + totalLabelWidth + index * columnWidth;
        const total = totals[field];
        const totalText = typeof total === "number" ? total.toFixed(2) : "";
        const renderedWidth = numberBold.widthOfTextAtSize(totalText, 6.2);
        page.drawRectangle({ x, y: currentY, width: columnWidth, height: rowHeight, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
        page.drawText(totalText, {
          x: Math.max(x + 2, x + columnWidth - renderedWidth - 2),
          y: currentY + 4,
          size: 6.2,
          font: numberBold,
          color: rgb(0, 0, 0),
        });
      });
    }

    currentY -= groupIndex < previewGroups.length - 1 ? rowHeight + 10 : 0;
  });

  page.drawText(`Dicetak oleh ${input.createdByName} pada ${new Date().toLocaleString("id-ID")}`, {
    x: marginX,
    y: 18,
    size: 6.2,
    font: serifRegular,
    color: muted,
  });
  page.drawText("Halaman 1 dari 1", {
    x: pageWidth - marginX - 42,
    y: 18,
    size: 6.2,
    font: serifRegular,
    color: muted,
  });

  return pdf.save();
}

export async function generateReportPdf(input: PdfReportInput) {
  const pdfBytes = await buildReportPdfBytes(input);
  const folder = path.join(process.cwd(), "public", "generated-reports", input.reportId);
  const outputName = input.workflow.outputName || buildOutputFileName(input.title, input.workflow.parameters);
  const filePath = path.join(folder, outputName);
  const publicUrl = `/generated-reports/${input.reportId}/${encodeURIComponent(outputName)}`;

  await mkdir(folder, { recursive: true });
  await writeFile(filePath, pdfBytes);

  return { filePath, publicUrl };
}

async function loadReportFonts(pdf: PDFDocument) {
  const notoSerifRegularPath = path.join(process.cwd(), "public", "fonts", "NotoSerif-Regular.woff");
  const notoSerifBoldPath = path.join(process.cwd(), "public", "fonts", "NotoSerif-Bold.woff");
  const calibriPath = "C:\\Windows\\Fonts\\calibri.ttf";
  const calibriBoldPath = "C:\\Windows\\Fonts\\calibrib.ttf";

  try {
    const [notoSerifRegularBytes, notoSerifBoldBytes, calibriBytes, calibriBoldBytes] = await Promise.all([
      readFile(notoSerifRegularPath),
      readFile(notoSerifBoldPath),
      readFile(calibriPath),
      readFile(calibriBoldPath),
    ]);

    const [serifRegular, serifBold, numberRegular, numberBold] = await Promise.all([
      pdf.embedFont(notoSerifRegularBytes, { subset: true }),
      pdf.embedFont(notoSerifBoldBytes, { subset: true }),
      pdf.embedFont(calibriBytes, { subset: true }),
      pdf.embedFont(calibriBoldBytes, { subset: true }),
    ]);

    return { serifRegular, serifBold, numberRegular, numberBold };
  } catch {
    const [serifRegular, serifBold, numberRegular, numberBold] = await Promise.all([
      pdf.embedFont(StandardFonts.TimesRoman),
      pdf.embedFont(StandardFonts.TimesRomanBold),
      pdf.embedFont(StandardFonts.Helvetica),
      pdf.embedFont(StandardFonts.HelveticaBold),
    ]);

    return { serifRegular, serifBold, numberRegular, numberBold };
  }
}
