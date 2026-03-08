import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { buildReportPreviewState } from "@/lib/report-builder";
import { buildReportTableGroups } from "@/lib/report-table-model";
import { buildOutputFileName } from "@/lib/report-workflow";
import type { ReportWorkflowMeta } from "@/types";

export type PdfReportInput = {
  reportId: string;
  title: string;
  category: string;
  description: string;
  createdByName: string;
  workflow: ReportWorkflowMeta;
};

type LoadedReportFonts = Awaited<ReturnType<typeof loadReportFonts>>;
type ReportPalette = ReturnType<typeof getReportPalette>;
type TableGroupModel = ReturnType<typeof buildReportTableGroups>[number];

export async function buildReportPdfBytes(input: PdfReportInput) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const pageSize = getA4PageSize(input.workflow.orientation);
  const page = pdf.addPage(pageSize);
  const { serifRegular, serifBold, numberRegular, numberBold } = await loadReportFonts(pdf);
  const { previewGroups, selectedFilterFieldMeta, subtitleText, tableFields } = buildReportPreviewState(input.workflow);
  const tableGroups = buildReportTableGroups({
    previewGroups,
    selectedFilterFieldLabel: selectedFilterFieldMeta?.label ?? null,
    sourceName: input.workflow.sourceName,
    tableFields,
  });

  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const marginX = 28;
  const palette = getReportPalette();

  drawReportHeader({
    marginX,
    page,
    pageHeight,
    pageWidth,
    serifBold,
    serifRegular,
    subtitleText,
    title: input.title,
  });

  const tableX = marginX;
  const tableWidth = pageWidth - marginX * 2;
  const numberColWidth = 18;
  const columnWidth = (tableWidth - numberColWidth) / Math.max(tableFields.length, 1);
  const rowHeight = 14;
  let currentY = pageHeight - 86;

  tableGroups.forEach((group, groupIndex) => {
    if (group.label) {
      page.drawText(`${group.label} : ${group.value}`, {
        x: tableX,
        y: currentY,
        size: 8,
        font: serifBold,
        color: palette.text,
      });
      currentY -= 12;
    }

    drawTableHeader({
      columnWidth,
      currentY,
      group,
      numberBold,
      numberColWidth,
      page,
      palette,
      rowHeight,
      serifBold,
      tableX,
    });

    currentY -= rowHeight;

    group.rows.forEach((row) => {
      drawTableRow({
        columnWidth,
        currentY,
        numberColWidth,
        numberRegular,
        page,
        palette,
        row,
        rowHeight,
        serifRegular,
        tableX,
      });

      currentY -= rowHeight;
    });

    drawTotalRow({
      columnWidth,
      currentY,
      group,
      numberBold,
      numberColWidth,
      page,
      palette,
      rowHeight,
      serifBold,
      tableX,
    });

    currentY -= groupIndex < tableGroups.length - 1 ? rowHeight + 10 : 0;
  });

  drawReportFooter({
    createdByName: input.createdByName,
    marginX,
    muted: palette.muted,
    page,
    serifRegular,
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

function getA4PageSize(orientation: ReportWorkflowMeta["orientation"]): [number, number] {
  return orientation === "LANDSCAPE" ? [841.89, 595.28] : [595.28, 841.89];
}

function getReportPalette() {
  return {
    text: rgb(0, 0, 0),
    muted: rgb(90 / 255, 94 / 255, 102 / 255),
    lightRow: rgb(238 / 255, 242 / 255, 247 / 255),
    darkRow: rgb(212 / 255, 219 / 255, 230 / 255),
    white: rgb(1, 1, 1),
  };
}

function drawReportHeader({
  marginX,
  page,
  pageHeight,
  pageWidth,
  serifBold,
  serifRegular,
  subtitleText,
  title,
}: {
  marginX: number;
  page: PDFPage;
  pageHeight: number;
  pageWidth: number;
  serifBold: LoadedReportFonts["serifBold"];
  serifRegular: LoadedReportFonts["serifRegular"];
  subtitleText: string;
  title: string;
}) {
  const palette = getReportPalette();
  const titleWidth = serifBold.widthOfTextAtSize(title, 13);
  page.drawText(title, {
    x: Math.max(marginX, (pageWidth - titleWidth) / 2),
    y: pageHeight - 46,
    size: 13,
    font: serifBold,
    color: palette.text,
  });

  const subtitleDisplay = subtitleText || " ";
  const subtitleWidth = serifRegular.widthOfTextAtSize(subtitleDisplay, 8);
  page.drawText(subtitleDisplay, {
    x: Math.max(marginX, (pageWidth - subtitleWidth) / 2),
    y: pageHeight - 58,
    size: 8,
    font: serifRegular,
    color: palette.muted,
    maxWidth: pageWidth - marginX * 2,
  });
}

function drawTableHeader({
  columnWidth,
  currentY,
  group,
  numberBold,
  numberColWidth,
  page,
  palette,
  rowHeight,
  serifBold,
  tableX,
}: {
  columnWidth: number;
  currentY: number;
  group: TableGroupModel;
  numberBold: LoadedReportFonts["numberBold"];
  numberColWidth: number;
  page: PDFPage;
  palette: ReportPalette;
  rowHeight: number;
  serifBold: LoadedReportFonts["serifBold"];
  tableX: number;
}) {
  page.drawRectangle({
    x: tableX,
    y: currentY,
    width: numberColWidth,
    height: rowHeight,
    color: palette.white,
    borderColor: palette.text,
    borderWidth: 1,
  });
  page.drawText("No", {
    x: tableX + 4,
    y: currentY + 4,
    size: 6.8,
    font: numberBold,
    color: palette.text,
  });

  group.columns.forEach((column, index) => {
    const x = tableX + numberColWidth + index * columnWidth;
    page.drawRectangle({
      x,
      y: currentY,
      width: columnWidth,
      height: rowHeight,
      color: palette.white,
      borderColor: palette.text,
      borderWidth: 1,
    });
    page.drawText(column.label, {
      x: x + 2,
      y: currentY + 4,
      size: 6.2,
      font: serifBold,
      color: palette.text,
      maxWidth: columnWidth - 4,
    });
  });
}

function drawTableRow({
  columnWidth,
  currentY,
  numberColWidth,
  numberRegular,
  page,
  palette,
  row,
  rowHeight,
  serifRegular,
  tableX,
}: {
  columnWidth: number;
  currentY: number;
  numberColWidth: number;
  numberRegular: LoadedReportFonts["numberRegular"];
  page: PDFPage;
  palette: ReportPalette;
  row: TableGroupModel["rows"][number];
  rowHeight: number;
  serifRegular: LoadedReportFonts["serifRegular"];
  tableX: number;
}) {
  const rowColor = row.rowTone === "odd" ? palette.darkRow : palette.lightRow;
  page.drawRectangle({
    x: tableX,
    y: currentY,
    width: numberColWidth,
    height: rowHeight,
    color: rowColor,
    borderColor: palette.text,
    borderWidth: 1,
  });
  page.drawText(String(row.index), {
    x: tableX + 5,
    y: currentY + 4,
    size: 6.2,
    font: numberRegular,
    color: palette.text,
  });

  row.cells.forEach((cell, index) => {
    const x = tableX + numberColWidth + index * columnWidth;
    const font = cell.kind === "number" ? numberRegular : serifRegular;
    const textWidth = font.widthOfTextAtSize(cell.displayValue, 5.9);
    const textX = cell.alignment === "right" ? Math.max(x + 2, x + columnWidth - textWidth - 2) : x + 2;

    page.drawRectangle({
      x,
      y: currentY,
      width: columnWidth,
      height: rowHeight,
      color: rowColor,
      borderColor: palette.text,
      borderWidth: 1,
    });
    page.drawText(cell.displayValue, {
      x: textX,
      y: currentY + 4,
      size: 5.9,
      font,
      color: palette.text,
      maxWidth: columnWidth - 4,
    });
  });
}

function drawTotalRow({
  columnWidth,
  currentY,
  group,
  numberBold,
  numberColWidth,
  page,
  palette,
  rowHeight,
  serifBold,
  tableX,
}: {
  columnWidth: number;
  currentY: number;
  group: TableGroupModel;
  numberBold: LoadedReportFonts["numberBold"];
  numberColWidth: number;
  page: PDFPage;
  palette: ReportPalette;
  rowHeight: number;
  serifBold: LoadedReportFonts["serifBold"];
  tableX: number;
}) {
  const totalLabelWidth =
    group.totalLabelColSpan === group.columns.length + 1
      ? numberColWidth + columnWidth * group.columns.length
      : numberColWidth + columnWidth * (group.totalLabelColSpan - 1);

  page.drawRectangle({
    x: tableX,
    y: currentY,
    width: totalLabelWidth,
    height: rowHeight,
    color: palette.white,
    borderColor: palette.text,
    borderWidth: 1,
  });
  page.drawText("Total", {
    x: tableX + 9,
    y: currentY + 4,
    size: 6.6,
    font: serifBold,
    color: palette.text,
  });

  group.totalCells.forEach((cell, index) => {
    const x = tableX + totalLabelWidth + index * columnWidth;
    const font = cell.kind === "number" ? numberBold : serifBold;
    const textWidth = font.widthOfTextAtSize(cell.displayValue, 6.2);
    const textX = cell.alignment === "right" ? Math.max(x + 2, x + columnWidth - textWidth - 2) : x + 2;

    page.drawRectangle({
      x,
      y: currentY,
      width: columnWidth,
      height: rowHeight,
      color: palette.white,
      borderColor: palette.text,
      borderWidth: 1,
    });
    page.drawText(cell.displayValue, {
      x: textX,
      y: currentY + 4,
      size: 6.2,
      font,
      color: palette.text,
    });
  });
}

function drawReportFooter({
  createdByName,
  marginX,
  muted,
  page,
  serifRegular,
}: {
  createdByName: string;
  marginX: number;
  muted: ReportPalette["muted"];
  page: PDFPage;
  serifRegular: LoadedReportFonts["serifRegular"];
}) {
  const pageWidth = page.getWidth();
  page.drawText(`Dicetak oleh ${createdByName} pada ${new Date().toLocaleString("id-ID")}`, {
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
}
