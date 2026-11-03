"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const plans = [
  {
    id: "pro" as const, name: "Pro", price: "9", description: "Per freelancers e piccoli siti",
    features: ["Monitoraggio settimanale", "1 dominio", "Scan Leak + Audit", "Storico report", "Alert email settimanali"],
  },
  {
    id: "business" as const, name: "Business", price: "29", description: "Per agenzie e PMI",
    features: ["Tutto di Pro", "Fino a 5 domini", "Export PDF completi", "Alert email immediati su critical", "Supporto prioritario"],
    highlighted: true,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (planId: "pro" | "business") => {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, mock: process.env.NEXT_PUBLIC_DEV_MODE === "true" }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      if (data.mock || data.ok) {
        setToast(data.message || "Piano attivato");
        setTimeout(() => router.push(data.redirect || "/onboarding"), 800);
        return;
      }
      setToast(data.error || "Errore checkout");
    } catch {
      setToast("Errore di rete");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Shield className="h-6 w-6 text-primary" /> GuardWeb
          </Link>
          <Button variant="ghost" size="sm" asChild><Link href="/demo">Hai un codice demo?</Link></Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold">Piani semplici e trasparenti</h1>
          <p className="mt-2 text-muted-foreground">Dopo il pagamento parti dall&apos;onboarding in 3 minuti.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : ""}>
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4"><span className="text-4xl font-bold">{plan.price}€</span><span className="text-muted-foreground">/mese</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} disabled={!!loading} onClick={() => handleCheckout(plan.id)}>
                  {loading === plan.id ? "Attivazione…" : `Scegli ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border rounded-lg px-4 py-3 shadow-lg text-sm z-50">{toast}</div>}
      </main>
    </div>
  );
}
