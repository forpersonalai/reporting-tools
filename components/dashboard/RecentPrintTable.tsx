"use client";

import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PrintHistoryItem } from "@/types";

export function RecentPrintTable({ rows }: { rows: PrintHistoryItem[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch =
          row.report.title.toLowerCase().includes(search.toLowerCase()) ||
          row.user.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === "ALL" || row.status === status;
        return matchesSearch && matchesStatus;
      }),
    [rows, search, status],
  );

  function exportSheet(fileName: string, type: "csv" | "xlsx") {
    const sheet = XLSX.utils.json_to_sheet(
      filtered.map((row) => ({
        Waktu: new Date(row.printedAt).toLocaleString("id-ID"),
        User: row.user.name,
        Laporan: row.report.title,
        Kategori: row.report.category,
        Salinan: row.copies,
        Halaman: row.pageCount,
        Printer: row.printerName,
        Status: row.status,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Print History");
    XLSX.writeFile(workbook, fileName, { bookType: type });
  }

  function getStatusClasses(statusValue: string) {
    switch (statusValue) {
      case "SUCCESS":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/16 dark:text-emerald-200";
      case "FAILED":
        return "bg-rose-100 text-rose-800 dark:bg-rose-500/16 dark:text-rose-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-500/16 dark:text-amber-200";
      default:
        return "bg-slate-200 text-slate-700 dark:bg-slate-500/16 dark:text-slate-200";
    }
  }

  return (
    <Card className="fade-up overflow-hidden">
      <CardHeader className="flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Recent print history</p>
            <CardTitle className="mt-3 text-xl md:text-2xl">Aktivitas print terbaru</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Riwayat terbaru dengan filter cepat dan export untuk kebutuhan operasional.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" className="rounded-full" onClick={() => exportSheet("print-history.csv", "csv")}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={() => exportSheet("print-history.xlsx", "xlsx")}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari user atau laporan" className="h-11 rounded-full pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-border bg-background/80 p-2.5 text-muted-foreground">
                <Filter className="h-4 w-4" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 w-full rounded-full md:w-44">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua status</SelectItem>
                  <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{filtered.length} baris ditampilkan</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 overflow-hidden">
        <div className="grid gap-3 md:hidden">
          {filtered.map((row) => (
            <article key={row.id} className="rounded-[24px] border border-border bg-background/76 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.report.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.user.name} · {row.report.category}</p>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getStatusClasses(row.status))}>{row.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Waktu</p>
                  <p className="mt-1 font-medium">{new Date(row.printedAt).toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Printer</p>
                  <p className="mt-1 font-medium">{row.printerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Salinan</p>
                  <p className="mt-1 font-medium">{row.copies}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Halaman</p>
                  <p className="mt-1 font-medium">{row.pageCount}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Waktu Print</th>
                <th className="pb-3 pr-4 font-medium">Nama User</th>
                <th className="pb-3 pr-4 font-medium">Nama Laporan</th>
                <th className="pb-3 pr-4 font-medium">Kategori</th>
                <th className="pb-3 pr-4 font-medium">Printer</th>
                <th className="pb-3 pr-4 font-medium">Salinan</th>
                <th className="pb-3 pr-4 font-medium">Halaman</th>
                <th className="pb-3 pr-0 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-border/80 align-top">
                  <td className="py-4 pr-4">{new Date(row.printedAt).toLocaleString("id-ID")}</td>
                  <td className="py-4 pr-4 font-medium">{row.user.name}</td>
                  <td className="py-4 pr-4">{row.report.title}</td>
                  <td className="py-4 pr-4">{row.report.category}</td>
                  <td className="py-4 pr-4">{row.printerName}</td>
                  <td className="py-4 pr-4">{row.copies}</td>
                  <td className="py-4 pr-4">{row.pageCount}</td>
                  <td className="py-4 pr-0">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getStatusClasses(row.status))}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-border bg-background/50 px-6 py-12 text-center text-sm text-muted-foreground">
            Tidak ada data yang cocok dengan filter saat ini.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
