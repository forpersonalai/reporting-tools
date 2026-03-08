import { Bell, Search, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="glass-card flex flex-col gap-4 rounded-[28px] border border-border/80 bg-card/90 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Main Dashboard</p>
        <h2 className="mt-2 text-2xl font-semibold">Pusat monitoring laporan dan print perusahaan</h2>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          Cari laporan, user, printer
        </div>
        <Badge variant="secondary" className="gap-2 border-0 bg-accent text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          AI Summary Ready
        </Badge>
        <ThemeToggle />
        <button className="rounded-full border border-border bg-background/80 p-3 text-muted-foreground transition hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-full border border-border bg-background/80 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">DA</div>
          <div>
            <p className="text-sm font-semibold">Demo Admin</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
