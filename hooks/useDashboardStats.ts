"use client";

import { useQuery } from "@tanstack/react-query";

import type { DashboardStats } from "@/types";

export function useDashboardStats(initialData: DashboardStats) {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      const json = (await response.json()) as { data: DashboardStats };
      return json.data;
    },
    initialData,
    refetchInterval: 30_000,
  });
}
