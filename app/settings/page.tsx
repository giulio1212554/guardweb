"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, KeyRound, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState("");
  const [hibpKey, setHibpKey] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [hasGithub, setHasGithub] = useState(false);
  const [hasHibp, setHasHibp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/keys")
      .then((r) => r.json())
      .then((d) => {
        setHasGithub(!!d.hasGithub);
        setHasHibp(!!d.hasHibp);
        setAlertEmail(d.alertEmail || "");
      })
      .catch(() => {});
  }, []);

  const save = async (extra?: Record<string, unknown>) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubToken: githubToken || undefined,
          hibpKey: hibpKey || undefined,
          alertEmail,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Errore");
      else {
        setMsg("Salvato. I token sono cifrati at-rest.");
        setGithubToken("");
        setHibpKey("");
        if (!extra?.clearGithub && githubToken) setHasGithub(true);
        if (!extra?.clearHibp && hibpKey) setHasHibp(true);
        if (extra?.clearGithub) setHasGithub(false);
        if (extra?.clearHibp) setHasHibp(false);
      }
    } catch {
      setMsg("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5 text-primary" /> GuardWeb
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-lg space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="h-6 w-6" /> Impostazioni
        </h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chiavi API personali</CardTitle>
            <CardDescription>
              Opzionali. Cifrate sul server; non vengono mai rimostrate in chiaro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">GitHub Token</label>
              <p className="text-xs text-muted-foreground mb-1">
                {hasGithub ? "Configurato" : "Non configurato"}
              </p>
              <Input type="password" placeholder="ghp_…" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium">HIBP API Key</label>
              <p className="text-xs text-muted-foreground mb-1">
                {hasHibp ? "Configurata" : "Non configurata"}
              </p>
              <Input type="password" placeholder="HIBP key" value={hibpKey} onChange={(e) => setHibpKey(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label className="text-sm font-medium">Email alert monitoraggio</label>
              <Input type="email" placeholder="tu@azienda.it" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} />
            </div>
            <Button onClick={() => save()} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Salva"}
            </Button>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
