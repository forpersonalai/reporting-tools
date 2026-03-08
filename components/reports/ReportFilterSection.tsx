"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReportPageOrientation, ReportWorkflowMeta } from "@/types";

type FilterOption = {
  key: string;
  label: string;
};

type ReportFilterSectionProps = {
  currentSourceDescription: string;
  currentSourceFields: FilterOption[];
  filterOptions: string[];
  onSourceChange: (sourceName: string) => void;
  onStatusChange: (status: string) => void;
  onUpdateFilterBy: (key: "field" | "value", value: string) => void;
  onUpdateWorkflowField: <K extends keyof ReportWorkflowMeta>(key: K, value: ReportWorkflowMeta[K]) => void;
  orientation: ReportPageOrientation;
  sourceName: string;
  status: string;
  workflow: ReportWorkflowMeta;
  sources: Array<{ key: string; label: string; tableName: string }>;
};

export function ReportFilterSection({
  currentSourceDescription,
  currentSourceFields,
  filterOptions,
  onSourceChange,
  onStatusChange,
  onUpdateFilterBy,
  onUpdateWorkflowField,
  orientation,
  sourceName,
  status,
  workflow,
  sources,
}: ReportFilterSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Node 1: Data source</Label>
        <Select value={sourceName} onValueChange={onSourceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih tabel database" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((source) => (
              <SelectItem key={source.key} value={source.key}>
                {source.label} ({source.tableName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{currentSourceDescription}</p>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">DRAFT</SelectItem>
            <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
            <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="filterRule">Node 2: Filter rows</Label>
        <Textarea
          id="filterRule"
          value={workflow.filterRule}
          onChange={(event) => onUpdateWorkflowField("filterRule", event.target.value)}
          placeholder="Contoh: status = 'SUCCESS' AND printed_at >= current_date"
        />
      </div>
      <div className="space-y-3 md:col-span-2">
        <Label>Filter By</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Field</Label>
            <Select
              value={workflow.filterBy.field || "__none"}
              onValueChange={(value) => onUpdateFilterBy("field", value === "__none" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih field untuk filter preview" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Tanpa filter</SelectItem>
                {currentSourceFields.map((field) => (
                  <SelectItem key={`filter-field-${field.key}`} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Value</Label>
            <Select
              value={workflow.filterBy.value || "__none"}
              onValueChange={(value) => onUpdateFilterBy("value", value === "__none" ? "" : value)}
              disabled={!workflow.filterBy.field}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih nilai filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Semua nilai</SelectItem>
                {filterOptions.map((option) => (
                  <SelectItem key={`filter-value-${option}`} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Pilih field untuk membagi output menjadi beberapa tabel per nilai field. Jika value juga dipilih, hanya grup tersebut yang ditampilkan.
        </p>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="summaryFocus">Node 3: Summary logic</Label>
        <Textarea
          id="summaryFocus"
          value={workflow.summaryFocus}
          onChange={(event) => onUpdateWorkflowField("summaryFocus", event.target.value)}
          placeholder="Fokus insight yang ingin muncul di PDF."
        />
      </div>
      <div className="space-y-2">
        <Label>Orientasi kertas</Label>
        <Select
          value={orientation}
          onValueChange={(value) => onUpdateWorkflowField("orientation", value as ReportPageOrientation)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih orientasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PORTRAIT">Portrait</SelectItem>
            <SelectItem value="LANDSCAPE">Landscape</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
