"use client";

import { useEffect, useState } from "react";

import type { PrintFeedItem } from "@/types";

interface PrintEvent {
  type: "init" | "new_prints" | "ping";
  data?: PrintFeedItem[];
}

export function useRealtimePrints() {
  const [prints, setPrints] = useState<PrintFeedItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/realtime/stream");

    source.onopen = () => setIsConnected(true);
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as PrintEvent;
      if ((payload.type === "init" || payload.type === "new_prints") && payload.data) {
        const incoming = payload.data;
        setPrints((previous) => {
          const merged = [...incoming, ...previous];
          const seen = new Set<string>();
          return merged.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          }).slice(0, 100);
        });
      }
    };
    source.onerror = () => {
      setIsConnected(false);
      source.close();
    };

    return () => source.close();
  }, []);

  return { prints, isConnected };
}
