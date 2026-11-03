"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SNIPPETS, type Stack } from "@/lib/remediation/snippets";
import { Copy, Check } from "lucide-react";

const STACKS: { id: Stack | "all"; label: string }[] = [
  { id: "all", label: "Tutti" },
  { id: "nginx", label: "Nginx" },
  { id: "apache", label: "Apache" },
  { id: "vercel", label: "Vercel" },
  { id: "cloudflare", label: "Cloudflare" },
  { id: "wordpress", label: "WordPress" },
  { id: "generic", label: "DNS" },
];

export function RemediationSnippets({ filterQuery }: { filterQuery?: string }) {
  const [stack, setStack] = useState<Stack | "all">("all");
  const [copied, setCopied] = useState<string | null>(null);

  const list = SNIPPETS.filter((s) => {
    if (stack !== "all" && s.stack !== stack) return false;
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.findingTypes.some((t) => q.includes(t.toLowerCase()))
      );
    }
    return true;
  });

  const copy = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STACKS.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={stack === s.id ? "default" : "outline"}
            onClick={() => setStack(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((s) => (
          <div key={s.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground capitalize">{s.stack}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => copy(s.id, s.code)}>
                {copied === s.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === s.id ? "Copiato" : "Copia"}
              </Button>
            </div>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">{s.code}</pre>
            {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
