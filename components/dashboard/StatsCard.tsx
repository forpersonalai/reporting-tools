import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/utils";

export function StatsCard({
  title,
  value,
  delta,
  hint,
}: {
  title: string;
  value: number;
  delta?: number;
  hint: string;
}) {
  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <p className="text-sm text-muted">{title}</p>
        <CardTitle className="text-4xl">{formatNumber(value)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm">
          {typeof delta === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800">
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
