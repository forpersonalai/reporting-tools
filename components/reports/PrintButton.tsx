"use client";

import { Printer } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PrintButton({ reportId }: { reportId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handlePrint() {
    setIsLoading(true);
    try {
      await fetch(`/api/reports/${reportId}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copies: 1,
          printerName: "Web-Print",
          pageCount: 1,
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handlePrint} disabled={isLoading}>
      <Printer className="h-4 w-4" />
      {isLoading ? "Memproses..." : "Trigger Print"}
    </Button>
  );
}
