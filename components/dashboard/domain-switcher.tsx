"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface DomainRow { domain: string; verified: boolean; }

export function DomainSwitcher({
  value,
  onChange,
}: {
  value?: string;
  onChange: (domain: string) => void;
}) {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [limit, setLimit] = useState(1);

  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then((d) => {
        setDomains(d.domains || []);
        setLimit(d.limit || 1);
      })
      .catch(() => {});
  }, []);

  if (!domains.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Nessun dominio verificato. Limite piano: {limit} sito{limit > 1 ? "i" : ""}.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Domini ({domains.length}/{limit}):
      </span>
      {domains.map((d) => (
        <Button
          key={d.domain}
          size="sm"
          variant={value === d.domain ? "default" : "outline"}
          onClick={() => onChange(d.domain)}
        >
          {d.domain}
        </Button>
      ))}
    </div>
  );
}
