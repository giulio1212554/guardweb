import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, FileText, ArrowRight, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur safe-top">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Shield className="h-6 w-6 text-primary" />
            GuardWeb
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing">Piani</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/demo">Demo</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-6">
          <Lock className="h-3.5 w-3.5" />
          Sicurezza etica e preventiva
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
          Scopri i rischi del tuo sito{" "}
          <span className="text-primary">prima che lo facciano altri</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          GuardWeb aiuta le PMI italiane a trovare credenziali esposte, configurazioni DNS deboli
          e a generare policy di sicurezza e privacy conformi al GDPR.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/demo">
              Richiedi accesso demo
              <ArrowRight className="ml-1" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">Vedi i piani</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 border-t border-border/40">
        <h2 className="text-2xl font-bold text-center mb-10">Come funziona</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Search, title: "1. Inserisci il dominio", desc: "Verifichi di esserne proprietario e lanci la scansione." },
            { icon: Shield, title: "2. Analisi completa", desc: "Leak di credenziali, header di sicurezza, DNS e Certificate Transparency." },
            { icon: FileText, title: "3. Report e policy", desc: "Findings prioritizzati, score e generatore security.txt + Privacy Policy." },
          ].map((step) => (
            <Card key={step.title} className="bg-card/50">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-2">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <CardDescription>{step.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground safe-bottom">
        <p>© {new Date().getFullYear()} GuardWeb – Sicurezza etica per PMI italiane</p>
      </footer>
    </div>
  );
}
