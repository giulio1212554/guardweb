"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Copy, Loader2, Shield } from "lucide-react";

type Status = "idle" | "pending" | "verified";

interface Props {
  domain: string;
  onVerified: (domain: string) => void;
  isDevMode?: boolean;
}

export function DomainVerifyWizard({ domain: initialDomain, onVerified, isDevMode }: Props) {
  const [domain, setDomain] = useState(initialDomain || "");
  const [status, setStatus] = useState<Status>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const start = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", domain: domain.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Errore"); return; }
      setToken(data.token); setStatus("pending");
    } catch { setError("Errore di rete"); }
    finally { setLoading(false); }
  };

  const check = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", domain: domain.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Errore"); return; }
      if (data.verified) {
        setStatus("verified"); setMethod(data.method);
        onVerified(domain.trim().toLowerCase());
      } else {
        setError(data.message || "Verifica non ancora rilevata.");
      }
    } catch { setError("Errore di rete"); }
    finally { setLoading(false); }
  };

 pan_skip = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip", domain: domain.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.verified) {
        setStatus("verified"); setMethod("dev-skip");
        onVerified(domain.trim().toLowerCase());
      }
    } finally { setLoading(false); }
  };

  // fix typo below - skip function
  const skip = pan_skip;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Verifica proprietà dominio
          </CardTitle>
          {status === "verified" && <Badge variant="success">Verificato</Badge>}
          {status === "pending" && <Badge variant="warning">In attesa</Badge>}
        </div>
        <CardDescription>
          Prima dei dettagli completi verifichiamo che tu sia titolare o autorizzato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "idle" && (
          <>
            <Input placeholder="esempio.it" value={domain} onChange={(e) => setDomain(e.target.value)} className="h-12" />
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="mt-1" />
              <span>Dichiaro di essere titolare del dominio o autorizzato a scansionarlo.</span>
            </label>
            <Button className="w-full h-12" onClick={start} disabled={loading || !domain.trim()}>
              {loading ? <Loader2 className="animate-spin" /> : "Avvia verifica"}
            </Button>
          </>
        )}
        {status === "pending" && token && (
          <div className="space-y-4">
            <p className="text-sm">Aggiungi <strong>uno</strong> di questi metodi:</p>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="font-medium text-sm">1. Record DNS TXT</div>
              <code className="block text-xs bg-muted p-2 rounded break-all">guardweb-verify={token}</code>
              <Button size="sm" variant="outline" onClick={() => copy(`guardweb-verify=${token}`)}>
                <Copy className="h-3.5 w-3.5" /> {copied ? "Copiato" : "Copia"}
              </Button>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="font-medium text-sm">2. File sul sito</div>
              <p className="text-xs text-muted-foreground">Crea <code>/.well-known/guardweb-verify.txt</code> con:</p>
              <code className="block text-xs bg-muted p-2 rounded break-all">{token}</code>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={check} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Ho configurato – verifica ora"}
              </Button>
              {isDevMode && (
                <Button variant="outline" onClick={skip} disabled={loading}>Salta verifica (DEV)</Button>
              )}
            </div>
          </div>
        )}
        {status === "verified" && (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span>Dominio verificato{method ? ` via ${method}` : ""}.</span>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
