"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, BarChart3, FileText, Printer, Settings, Sparkles, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/reports", label: "Laporan", icon: FileText },
  { href: "/print-history", label: "Print History", icon: Printer },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 hidden min-h-[calc(100vh-2rem)] w-80 flex-col rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,#27211d_0%,#171311_100%)] px-5 py-6 text-[#f5efe7] shadow-[0_28px_64px_rgba(17,12,9,0.26)] lg:flex">
      <div className="mb-10 rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/56">Reporting Tools</p>
            <h1 className="mt-3 text-[2rem] font-semibold leading-tight">Shine reporting workspace</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/10 p-3 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/72">Dashboard yang fokus pada monitoring print, kualitas laporan, dan insight operasional tanpa noise.</p>
      </div>

      <nav className="space-y-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "fade-up flex items-center justify-between rounded-[22px] px-4 py-3.5 text-sm transition",
                isActive
                  ? "bg-[#f4efe8] text-[#1f1a17]"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </span>
              <ArrowUpRight className={cn("h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 rounded-[28px] border border-white/10 bg-white/6 p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/56">Realtime channel</p>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/14 px-3 py-1 text-xs font-medium text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <p className="text-white/56">Event sync</p>
            <p className="mt-2 text-2xl font-semibold">24/7</p>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <p className="text-white/56">AI queue</p>
            <p className="mt-2 text-2xl font-semibold">&lt; 1m</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-white/72">Stream print aktif dan summary AI bisa dipantau dari satu alur kerja yang sama.</p>
      </div>
    </aside>
  );
}
