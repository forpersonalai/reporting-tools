"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSourceFieldMeta } from "@/lib/report-data-sources";
import type { ReportAggregateType } from "@/types";

type ReportAggregateSectionProps = {
  onUpdateAggregate: (field: string, aggregate: ReportAggregateType) => void;
  sourceName: string;
  tableFields: string[];
  values: Record<string, ReportAggregateType>;
};

export function ReportAggregateSection({
  onUpdateAggregate,
  sourceName,
  tableFields,
  values,
}: ReportAggregateSectionProps) {
  return (
    <div className="space-y-3 md:col-span-2">
      <Label>Total Row Rules</Label>
      <div className="grid gap-3 md:grid-cols-2">
        {tableFields.map((field) => {
          const meta = getSourceFieldMeta(sourceName, field);
          if (!meta || (meta.kind !== "number" && meta.kind !== undefined)) {
            return null;
          }

          return (
            <div key={`agg-${field}`} className="rounded-2xl border border-border bg-background/60 p-3">
              <p className="text-sm font-semibold">{meta.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">Tentukan perhitungan untuk baris total.</p>
              <Select value={values[field] ?? "NONE"} onValueChange={(value) => onUpdateAggregate(field, value as ReportAggregateType)}>
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
  );
}
