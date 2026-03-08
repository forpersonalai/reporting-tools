"use client";

import { Clock3, Printer, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimePrints } from "@/hooks/useRealtimePrints";

export function RealtimeFeed() {
  const { prints, isConnected } = useRealtimePrints();

  return (
    <Card className="fade-up">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Live print activity</p>
          <CardTitle className="mt-3 text-xl">Feed realtime</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">Pergerakan print terbaru dari seluruh user yang sedang aktif.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 text-xs font-medium">
          <Radio className={`h-3.5 w-3.5 ${isConnected ? "text-emerald-500" : "text-muted-foreground"}`} />
          <span>{isConnected ? "LIVE" : "Disconnected"}</span>
        </div>
      </CardHeader>
      <CardContent className="max-h-[30rem] overflow-auto">
        <div className="space-y-3">
          {prints.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Menunggu aktivitas print terbaru...</p>
          ) : (
            prints.map((print) => (
              <div key={print.id} className="rounded-[22px] border border-border bg-background/72 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="leading-6">
                        <span className="font-semibold">{print.user.name}</span> mencetak{" "}
                        <span className="font-semibold">{print.report.title}</span> sebanyak {print.copies} salinan
                      </p>
                      <Badge variant="secondary" className="rounded-full border-0 bg-secondary px-3 py-1 text-secondary-foreground">
                        {print.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-accent px-3 py-1 text-accent-foreground">{print.report.category}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(print.printedAt).toLocaleTimeString("id-ID")}
                      </span>
                      <span className="text-xs text-muted-foreground">{print.printerName}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-[18px] border border-border/80 bg-card/70 p-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Pages</p>
                        <p className="mt-1 text-sm font-semibold">{print.pageCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Durasi</p>
                        <p className="mt-1 text-sm font-semibold">{print.duration}s</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
