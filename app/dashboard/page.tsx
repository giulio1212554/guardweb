"use client";
import { useState } from "react";
import Link from "next/link";
import { DomainSearch } from "@/components/dashboard/domain-search";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, AlertTriangle, CheckCircle2, Copy, FileText } from "lucide-react";
import type { LeakScanResult, AuditScanResult, Finding } from "@/types/report";

function SeverityBadge({ severity }: { severity: string }) {
  const variant = severity === "critical" || severity === "high" ? "destructive" : severity === "medium" ? "warning" : "secondary";
  return <Badge variant={variant as any}>{severity}</Badge>;
}

function FindingCard({ f }: { f: Finding }) {
  return (
    <div className="p-4 rounded-lg border bg-card/50 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm">{f.title}</h4>
        <SeverityBadge severity={f.severity} />
      </div>
      <p className="text-sm text-muted-foreground">{f.description}</p>
      {f.evidence && <code className="block text-xs bg-muted px-2 py-1 rounded mt-1 overflow-x-auto">{f.evidence}</code>}
      {f.remediation && <p className="text-xs text-muted-foreground mt-2"><strong>Come risolvere:</strong> {f.remediation}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leakResult, setLeakResult] = useState<LeakScanResult | null>(null);
  const [auditResult, setAuditResult] = useState<AuditScanResult | null>(null);
  const [scansLeft, setScansLeft] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [activeTab, setActiveTab] = useState("leaks");
  const [domain, setDomain] = useState("");
  const [genData, setGenData] = useState({ companyName: "", vatNumber: "", address: "", privacyEmail: "", securityEmail: "" });
  const [generated, setGenerated] = useState<{ privacy: string; security: string } | null>(null);
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  const runScan = async (d: string) => {
    setLoading(true); setError(null); setDomain(d); setLeakResult(null); setAuditResult(null);
    try {
      const [leakRes, auditRes] = await Promise.all([
        fetch("/api/scan/leaks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: d }) }),
        fetch("/api/scan/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: d }) }),
      ]);
      const leakData = await leakRes.json();
      const auditData = await auditRes.json();
      if (!leakRes.ok) { setError(leakData.error || "Errore scansione leak"); return; }
      if (!auditRes.ok) { setError(auditData.error || "Errore audit"); return; }
      setLeakResult(leakData); setAuditResult(auditData);
      if (leakData.isDemo || auditData.isDemo) {
        setIsDemo(true);
        setScansLeft(leakData.scansLeft ?? auditData.scansLeft ?? 0);
      }
    } catch (e: any) {
      setError(e.message || "Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    const privacy = `# Informativa Privacy – ${genData.companyName}\n\nAVVISO: bozza generata da GuardWeb.\n\nTitolare: ${genData.companyName}\nP.IVA: ${genData.vatNumber}\nSede: ${genData.address}\nEmail privacy: ${genData.privacyEmail}\nEmail sicurezza: ${genData.securityEmail}\n\nGenerato il ${new Date().toLocaleDateString("it-IT")} da GuardWeb.`;
    const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
    const security = `Contact: mailto:${genData.securityEmail || genData.privacyEmail}\nExpires: ${expires.toISOString()}\nPreferred-Languages: it, en\n\n# Generato da GuardWeb\n# Pubblica in: /.well-known/security.txt`;
    setGenerated({ privacy, security });
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {isDemo && scansLeft !== null && <DemoBanner scansLeft={scansLeft} />}
      <header className="border-b border-border/40 sticky top-0 z-40 bg-background/90 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5 text-primary" /> GuardWeb
          </Link>
          <div className="text-sm text-muted-foreground">{isDemo ? "Demo" : "Pro"}</div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="mb-8"><DomainSearch onScan={runScan} loading={loading} isDevMode={isDev} /></div>
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{error}
          </div>
        )}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Analisi in corso su {domain}…</p>
          </div>
        )}
        {!loading && (leakResult || auditResult) && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="leaks">Leak & Credenziali</TabsTrigger>
              <TabsTrigger value="audit">Security Audit</TabsTrigger>
              <TabsTrigger value="generator">Generatore Policy</TabsTrigger>
            </TabsList>
            <TabsContent value="leaks" className="space-y-4">
              {leakResult && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    {leakResult.findings.length === 0 ? (
                      <div className="flex items-center gap-2 text-success"><CheckCircle2 className="h-5 w-5" /><span className="font-medium">Nessun leak critico trovato</span></div>
                    ) : (
                      <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /><span className="font-medium">{leakResult.findings.length} possibili rischi trovati</span></div>
                    )}
                  </div>
                  <div className="grid gap-3">{leakResult.findings.map((f) => <FindingCard key={f.id} f={f} />)}</div>
                </>
              )}
            </TabsContent>
            <TabsContent value="audit" className="space-y-6">
              {auditResult && (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ScoreGauge score={auditResult.score} grade={auditResult.grade} />
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <h3 className="text-xl font-semibold">Security Score</h3>
                      <p className="text-muted-foreground text-sm">Basato su header, HTTPS, SPF/DMARC/DKIM e DNS.</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <h4 className="font-medium">Header di sicurezza</h4>
                    {auditResult.headers.map((h) => (
                      <div key={h.name} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${h.status === "ok" ? "bg-success" : h.status === "warn" ? "bg-warning" : "bg-destructive"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{h.name}</div>
                          <p className="text-xs text-muted-foreground">{h.message}</p>
                          {h.remediation && <p className="text-xs mt-1 text-muted-foreground">→ {h.remediation}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="generator" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Generatore Policy & security.txt</CardTitle>
                  <CardDescription>Compila i campi per generare Privacy Policy e security.txt.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-base" placeholder="Ragione sociale" value={genData.companyName} onChange={(e) => setGenData({ ...genData, companyName: e.target.value })} />
                    <input className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-base" placeholder="P.IVA" value={genData.vatNumber} onChange={(e) => setGenData({ ...genData, vatNumber: e.target.value })} />
                    <input className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-base sm:col-span-2" placeholder="Sede legale" value={genData.address} onChange={(e) => setGenData({ ...genData, address: e.target.value })} />
                    <input className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-base" placeholder="Email privacy" type="email" value={genData.privacyEmail} onChange={(e) => setGenData({ ...genData, privacyEmail: e.target.value })} />
                    <input className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-base" placeholder="Email sicurezza" type="email" value={genData.securityEmail} onChange={(e) => setGenData({ ...genData, securityEmail: e.target.value })} />
                  </div>
                  <Button onClick={handleGenerate} disabled={!genData.companyName || !genData.privacyEmail}>Genera documenti</Button>
                  {generated && (
                    <div className="space-y-4 mt-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">Privacy Policy (bozza)</h4>
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(generated.privacy)}><Copy className="h-3.5 w-3.5" /> Copia</Button>
                        </div>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap">{generated.privacy}</pre>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">security.txt</h4>
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(generated.security)}><Copy className="h-3.5 w-3.5" /> Copia</Button>
                        </div>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{generated.security}</pre>
                        <p className="text-xs text-muted-foreground mt-2">Pubblica in: <code>/.well-known/security.txt</code></p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        {!loading && !leakResult && !auditResult && !error && (
          <div className="text-center py-16 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>Inserisci un dominio per iniziare l&apos;analisi</p>
          </div>
        )}
      </main>
    </div>
  );
}
