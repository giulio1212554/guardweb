"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

export default function DemoPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Errore"); return; }
      router.push("/dashboard");
    } catch {
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Shield className="h-6 w-6 text-primary" /> GuardWeb
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Accesso demo</CardTitle>
            <CardDescription>Inserisci il codice demo ricevuto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-4">
              <Input
                placeholder="GW-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-lg tracking-wider font-mono h-12"
                disabled={loading}
              />
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full h-12" disabled={loading || code.length < 10}>
                {loading ? <><Loader2 className="animate-spin" /> Verifica...</> : "Attiva e vai alla dashboard"}
              </Button>
            </form>
            {isDev && (
              <div className="mt-6 p-3 rounded-lg bg-muted/50 text-sm text-center">
                <p className="text-muted-foreground mb-1">DEV_MODE attivo</p>
                <button type="button" className="text-primary underline font-mono" onClick={() => setCode("GW-TEST-0000")}>
                  GW-TEST-0000
                </button>
              </div>
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Non hai un codice? <Link href="/pricing" className="text-primary underline">Vedi i piani</Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
