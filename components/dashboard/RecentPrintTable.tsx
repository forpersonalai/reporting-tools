"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  return (
    <Card className="fade-up">
      <CardHeader className="flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CardTitle>Recent Print History</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari user atau laporan" className="w-64" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
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
          <Button variant="secondary" onClick={() => exportSheet("print-history.csv", "csv")}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="secondary" onClick={() => exportSheet("print-history.xlsx", "xlsx")}>
            <Download className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="pb-3 pr-4">Waktu Print</th>
              <th className="pb-3 pr-4">Nama User</th>
              <th className="pb-3 pr-4">Nama Laporan</th>
              <th className="pb-3 pr-4">Kategori</th>
              <th className="pb-3 pr-4">Salinan</th>
              <th className="pb-3 pr-4">Halaman</th>
              <th className="pb-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-border/80">
                <td className="py-4 pr-4">{new Date(row.printedAt).toLocaleString("id-ID")}</td>
                <td className="py-4 pr-4">{row.user.name}</td>
                <td className="py-4 pr-4">{row.report.title}</td>
                <td className="py-4 pr-4">{row.report.category}</td>
                <td className="py-4 pr-4">{row.copies}</td>
                <td className="py-4 pr-4">{row.pageCount}</td>
                <td className="py-4 pr-4">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
