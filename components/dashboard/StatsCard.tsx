import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

export function StatsCard({
  title,
  value,
  delta,
  hint,
  icon: Icon,
  accentClassName,
}: {
  title: string;
  value: number;
  delta?: number;
  hint: string;
  icon: LucideIcon;
  accentClassName?: string;
}) {
  return (
    <Card className="fade-up gap-4 overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{title}</p>
            <CardTitle className="mt-3 text-4xl tracking-[-0.04em]">{formatNumber(value)}</CardTitle>
          </div>
          <div className={cn("rounded-[20px] p-3", accentClassName ?? "bg-primary/12 text-primary")}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {typeof delta === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800 dark:bg-emerald-500/16 dark:text-emerald-200">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {formatPercent(delta)}
            </span>
          )}
          <span className="text-muted">{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}
