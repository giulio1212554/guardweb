"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Point {
  id: string;
  domain: string;
  score?: number;
  createdAt: string;
}

export function ScoreHistory({ domain }: { domain?: string }) {
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => {
        let list = (d.reports || []) as Point[];
        if (domain) list = list.filter((r) => r.domain === domain);
        setPoints(list.slice(0, 12).reverse());
      })
      .catch(() => {});
  }, [domain]);

  if (!points.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessuno storico ancora. Salva almeno due scan.
      </p>
    );
  }

  const max = Math.max(...points.map((p) => p.score || 0), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-28">
        {points.map((p) => (
          <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{p.score ?? "–"}</span>
            <div
              className="w-full rounded-t bg-primary/80 min-h-[4px]"
              style={{ height: `${((p.score || 0) / max) * 100}%` }}
              title={`${p.score}`}
            />
          </div>
        ))}
      </div>
      <ul className="space-y-2 text-sm">
        {points
          .slice()
          .reverse()
          .map((p, i, arr) => {
            const prev = arr[i + 1];
            const delta =
              p.score != null && prev?.score != null ? p.score - prev.score : null;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 border-b border-border/40 py-1"
              >
                <span className="text-muted-foreground text-xs">
                  {new Date(p.createdAt).toLocaleString("it-IT")}
                </span>
                <span className="font-medium">{p.score ?? "–"}</span>
                {delta != null && (
                  <Badge variant={delta >= 0 ? "success" : "destructive"}>
                    {delta >= 0 ? `+${delta}` : delta}
                  </Badge>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
