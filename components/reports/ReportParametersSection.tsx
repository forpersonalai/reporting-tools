"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReportParameter } from "@/types";

type ReportParametersSectionProps = {
  onAddParameter: () => void;
  onRemoveParameter: (parameterId: string) => void;
  onUpdateParameter: (parameterId: string, key: keyof ReportParameter, value: string) => void;
  parameters: ReportParameter[];
};

export function ReportParametersSection({
  onAddParameter,
  onRemoveParameter,
  onUpdateParameter,
  parameters,
}: ReportParametersSectionProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Custom Parameters</p>
          <p className="mt-1 text-xs text-muted-foreground">Parameter ini akan ditampilkan di bawah judul laporan dan nantinya bisa dipakai untuk query database.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddParameter}>
          <Plus className="h-4 w-4" />
          Tambah Parameter
        </Button>
      </div>
      <div className="grid gap-3">
        {parameters.map((parameter) => (
          <div key={parameter.id} className="grid gap-3 rounded-2xl border border-border bg-card/70 p-3 md:grid-cols-[0.9fr_1.1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor={`label-${parameter.id}`}>Label</Label>
              <Input id={`label-${parameter.id}`} value={parameter.label} onChange={(event) => onUpdateParameter(parameter.id, "label", event.target.value)} placeholder="Contoh: Dari" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`value-${parameter.id}`}>Value</Label>
              <Input id={`value-${parameter.id}`} value={parameter.value} onChange={(event) => onUpdateParameter(parameter.id, "value", event.target.value)} placeholder="Contoh: 01-Mar-26" />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveParameter(parameter.id)} disabled={parameters.length <= 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
