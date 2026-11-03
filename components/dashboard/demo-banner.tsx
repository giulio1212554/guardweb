"use client";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
export function DemoBanner({ scansLeft }: { scansLeft: number }) {
  return (
    <div className="bg-warning/15 border-b border-warning/30 text-warning-foreground px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm safe-top">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span><strong>Modalità demo</strong>: {scansLeft} scansioni rimaste.</span>
      </div>
      <Link href="/pricing" className="underline font-medium hover:no-underline whitespace-nowrap">Passa a Pro →</Link>
    </div>
  );
}
