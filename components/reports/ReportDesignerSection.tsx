"use client";

import { BadgePlus, GripVertical, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getFieldLabel, getFieldPreviewValue } from "@/lib/report-workflow";
import type { ReportLayoutItem, ReportLayoutSection } from "@/types";

type ReportDesignerSectionProps = {
  availableFields: string[];
  layout: ReportLayoutItem[];
  onAddSuggestedField: (field: string) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, field: string) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>, section: ReportLayoutSection) => void;
  onRemoveFieldFromLayout: (field: string) => void;
  onToggleFieldSelection: (field: string) => void;
  sections: Array<{ key: ReportLayoutSection; title: string; description: string }>;
  sourceName: string;
};

export function ReportDesignerSection({
  availableFields,
  layout,
  onAddSuggestedField,
  onDragOver,
  onDragStart,
  onDrop,
  onRemoveFieldFromLayout,
  onToggleFieldSelection,
  sections,
  sourceName,
}: ReportDesignerSectionProps) {
  const selectedFields = layout.map((item) => item.field);

  return (
    <div className="space-y-3 md:col-span-2">
      <Label>Node 4: Report designer</Label>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Field Library</p>
              <p className="mt-1 text-xs text-muted-foreground">Kolom diambil dari tabel database yang dipilih.</p>
            </div>
            <Badge variant="secondary">{selectedFields.length} field aktif</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {availableFields.map((field) => {
              const exists = layout.some((item) => item.field === field);

              return (
                <div
                  key={field}
                  draggable
                  onDragStart={(event) => onDragStart(event, field)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{getFieldLabel(sourceName, field)}</p>
                    <p className="truncate text-xs text-muted-foreground">{getFieldPreviewValue(sourceName, field)}</p>
                  </div>
                  {exists ? (
                    <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveFieldFromLayout(field)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" size="icon" onClick={() => onAddSuggestedField(field)}>
                      <BadgePlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-background/60 p-4">
          <div>
            <p className="text-sm font-semibold">Layout Bands</p>
            <p className="mt-1 text-xs text-muted-foreground">Drop kolom ke band yang sesuai. Field library langsung mengikuti tabel yang dipilih.</p>
          </div>
          <div className="mt-4 space-y-4">
            {sections.map((section) => {
              const items = layout.filter((item) => item.section === section.key);

              return (
                <div
                  key={section.key}
                  onDrop={(event) => onDrop(event, section.key)}
                  onDragOver={onDragOver}
                  className="rounded-3xl border border-dashed border-border bg-card/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{section.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
                    </div>
                    <Badge variant="outline">{items.length} item</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {items.length === 0 ? (
                      <div className="rounded-2xl bg-secondary/50 px-3 py-4 text-sm text-muted-foreground">Drop field di sini</div>
                    ) : (
                      items.map((item) => (
                        <div key={`${section.key}-${item.field}`} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="truncate text-xs text-muted-foreground">{getFieldPreviewValue(sourceName, item.field)}</p>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveFieldFromLayout(item.field)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableFields.map((field) => {
          const selected = layout.some((item) => item.field === field);

          return (
            <button
              key={field}
              type="button"
              onClick={() => onToggleFieldSelection(field)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
              }`}
            >
              {getFieldLabel(sourceName, field)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
