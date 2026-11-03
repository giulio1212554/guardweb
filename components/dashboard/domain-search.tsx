"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface DomainSearchProps {
  onScan: (domain: string, skipVerify?: boolean) => void;
  loading?: boolean;
  isDevMode?: boolean;
}

export function DomainSearch({ onScan, loading, isDevMode }: DomainSearchProps) {
  const [domain, setDomain] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (cleaned) onScan(cleaned);
  };
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="esempio.it" value={domain} onChange={(e) => setDomain(e.target.value)}
          className="flex-1 text-base h-12" disabled={loading} aria-label="Dominio da analizzare" />
        <Button type="submit" size="lg" disabled={loading || !domain.trim()} className="h-12 px-6">
          {loading ? <><Loader2 className="animate-spin" /> Analisi...</> : <><Search /> Analizza</>}
        </Button>
      </div>
    </form>
  );
}
