"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, ExternalLink } from "lucide-react";

interface ReportRow { id: string; domain: string; score?: number; createdAt: string; }

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then((d) => {
      if (d.error) setError(d.error);
      else setReports(d.reports || []);
    }).catch(() => setError("Errore di rete"));
  }, []);
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5 text-primary" /> GuardWeb
          </Link>
          <Button variant="ghost" size="sm" asChild><Link href="/dashboard">Dashboard</Link></Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6" /> Storico report
        </h1>
        {error && <p className="text-destructive text-sm mb-4">{error}</p>}
        {reports.length === 0 && !error && <p className="text-muted-foreground">Nessun report salvato ancora.</p>}
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span>{r.domain}</span>
                  {r.score != null && <span className="text-sm font-normal text-muted-foreground">Score {r.score}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("it-IT")}</span>
                <Button size="sm" variant="outline" asChild>
                  <a href={`/api/reports/${r.id}?format=html`} target="_blank" rel="noreferrer">
                    PDF / Stampa <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
