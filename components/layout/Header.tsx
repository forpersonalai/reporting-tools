"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/", label: "Dashboard" },
  { href: "/reports", label: "Laporan" },
  { href: "/print-history", label: "History" },
  { href: "/users", label: "Users" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="rounded-[30px] border border-border/80 bg-[rgba(255,252,246,0.9)] px-5 py-4 shadow-[0_24px_60px_rgba(43,37,30,0.08)] backdrop-blur-xl dark:bg-[rgba(31,26,23,0.88)] md:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Overview workspace
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">Dashboard monitoring yang lebih jelas, ringkas, dan siap dipakai harian</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            Pantau performa print, laporan populer, dan aktivitas pengguna dari satu tampilan yang mudah dibaca di desktop maupun mobile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-border bg-background/80 px-4 py-2.5 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Cari laporan, user, printer
          </div>
          <Badge variant="secondary" className="gap-2 rounded-full border-0 bg-accent px-3 py-2 text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insight Active
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
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
                isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/72 text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
