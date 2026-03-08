"use client";

import { Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimePrints } from "@/hooks/useRealtimePrints";

export function RealtimeFeed() {
  const { prints, isConnected } = useRealtimePrints();

  return (
    <Card className="fade-up">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Live Print Activity</CardTitle>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "animate-pulse bg-primary" : "bg-muted-foreground/40"}`} />
          <span>{isConnected ? "LIVE" : "Disconnected"}</span>
        </div>
      </CardHeader>
      <CardContent className="max-h-80 overflow-auto">
        <div className="space-y-3">
          {prints.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Menunggu aktivitas print terbaru...</p>
          ) : (
            prints.map((print) => (
              <div key={print.id} className="rounded-2xl border border-border bg-background/65 p-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p>
                      <span className="font-semibold">{print.user.name}</span> mencetak{" "}
                      <span className="font-semibold">{print.report.title}</span> sebanyak {print.copies} salinan
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge>{print.report.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(print.printedAt).toLocaleTimeString("id-ID")}
                      </span>
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
