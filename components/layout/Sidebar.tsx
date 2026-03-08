import Link from "next/link";
import { BarChart3, FileText, Printer, Settings, Users } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/reports", label: "Laporan", icon: FileText },
  { href: "/print-history", label: "Print History", icon: Printer },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="glass-card app-shell-grid hidden min-h-[calc(100vh-2rem)] w-72 flex-col rounded-[32px] border border-border/80 bg-sidebar/90 p-5 text-sidebar-foreground lg:flex">
      <div className="mb-10 px-3 pt-3">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Reporting Tools</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight">Operational reporting cockpit</h1>
        <p className="mt-3 text-sm text-muted-foreground">Pantau aktivitas print, laporan, dan insight AI dalam satu panel.</p>
      </div>
      <nav className="space-y-2">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="fade-up flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-[26px] border border-primary/20 bg-primary p-5 text-primary-foreground">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary-foreground/70">Realtime</p>
        <p className="mt-2 text-lg font-semibold">Live feed aktif</p>
        <p className="mt-2 text-sm text-primary-foreground/75">SSE mengirim heartbeat dan event print terbaru setiap beberapa detik.</p>
      </div>
    </aside>
  );
}
