"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ArchiveReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleArchive() {
    if (!window.confirm("Arsipkan laporan ini? Laporan akan tetap ada tetapi status berubah menjadi ARCHIVED.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Gagal mengarsipkan laporan.");
      }
      router.push("/reports");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleArchive}>
      {isSubmitting ? "Mengarsipkan..." : "Arsipkan"}
    </Button>
  );
}
