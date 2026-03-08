"use client";

import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildReportTableGroups } from "@/lib/report-table-model";
import type { ReportPreviewGroupWithTotals } from "@/lib/report-builder";

type ReportPreviewCardProps = {
  createdByName: string;
  isPreviewingPdf: boolean;
  onLivePreviewPdf: () => void;
  orientation: "PORTRAIT" | "LANDSCAPE";
  outputFileName: string;
  previewGroups: ReportPreviewGroupWithTotals[];
  sourceName: string;
  subtitleText: string;
  tableFields: string[];
  title: string;
  selectedFilterFieldLabel?: string | null;
};

export function ReportPreviewCard({
  createdByName,
  isPreviewingPdf,
  onLivePreviewPdf,
  orientation,
  outputFileName,
  previewGroups,
  sourceName,
  subtitleText,
  tableFields,
  title,
  selectedFilterFieldLabel,
}: ReportPreviewCardProps) {
  const tableGroups = buildReportTableGroups({
    previewGroups,
    selectedFilterFieldLabel,
    sourceName,
    tableFields,
  });

  return (
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
            <Button type="button" variant="secondary" size="sm" onClick={onLivePreviewPdf} disabled={isPreviewingPdf}>
              {isPreviewingPdf ? "Membuat preview..." : "Live Preview PDF"}
            </Button>
          </div>
        </div>
        <div
          className={`report-preview-page rounded-[20px] border border-zinc-300 bg-[#f3f4f6] p-4 shadow-sm dark:bg-[#f3f4f6] ${
            orientation === "LANDSCAPE" ? "overflow-x-auto" : ""
          }`}
        >
          <div
            className={`mx-auto bg-white px-6 py-7 text-[9px] leading-[1.15] text-black shadow-[0_0_0_1px_rgba(0,0,0,0.12)] ${
              orientation === "LANDSCAPE"
                ? "aspect-[297/210] min-w-[820px]"
                : "aspect-[210/297] w-full max-w-[595px]"
            }`}
          >
            <h1 className="report-preview-text text-center text-[13px] font-bold">{title || "Judul Laporan"}</h1>
            <p className="report-preview-text mt-1 text-center text-[8px] text-zinc-600">{subtitleText || "Tambahkan parameter untuk subtitle laporan"}</p>

            <div className="mt-3 space-y-5">
              {tableGroups.map((group) => (
                <div key={`preview-group-${group.key}`} className="space-y-1.5">
                  {group.label ? (
                    <p className="report-preview-text text-left text-[9px] font-bold text-black">
                      {group.label} : {group.value}
                    </p>
                  ) : null}

                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse border border-black">
                      <thead className="table-header-group">
                        <tr>
                          <th className="report-preview-text report-preview-number w-9 border border-black px-1 py-[3px] text-center text-[8px] font-bold">No</th>
                          {group.columns.map((column) => (
                            <th key={`th-${group.key}-${column.key}`} className="report-preview-text border border-black px-1 py-[3px] text-center text-[8px] font-bold leading-tight">
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row, index) => (
                          <tr key={`row-${group.key}-${index}`} className={row.rowTone === "odd" ? "bg-[#d4dbe6]" : "bg-[#eef2f7]"}>
                            <td className="report-preview-number border border-black px-1 py-[2px] text-center align-middle">{row.index}</td>
                            {row.cells.map((cell, cellIndex) => {
                              const cellClass =
                                cell.kind === "number"
                                  ? "report-preview-number text-right"
                                  : cell.alignment === "center"
                                    ? "report-preview-text text-center"
                                    : "report-preview-text text-left";

                              return (
                                <td key={`cell-${group.key}-${index}-${cellIndex}`} className={`border border-black px-1 py-[2px] align-middle ${cellClass}`}>
                                  {cell.displayValue}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {group.rows.length > 0 ? (
                          <tr className="bg-white text-[8px] font-bold">
                            <td colSpan={group.totalLabelColSpan} className="report-preview-text border border-black px-1 py-[2px] text-center">
                              Total
                            </td>
                            {group.totalCells.map((cell, index) => {
                              return (
                                <td key={`total-${group.key}-${cell.field}-${index}`} className={`border border-black px-1 py-[2px] ${cell.kind === "number" ? "report-preview-number text-right" : "report-preview-text text-center"}`}>
                                  {cell.displayValue}
                                </td>
                              );
                            })}
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={group.columns.length + 1} className="border border-black px-1 py-2 text-center text-[8px]">
                              {group.emptyMessage}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="report-preview-text mt-4 flex items-end justify-between text-[7px] italic text-zinc-600">
              <div>Dicetak oleh {createdByName} pada 08-Mar-26 05:30</div>
              <div>Halaman 1 dari 1</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
