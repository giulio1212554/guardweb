import type { Finding } from "@/types/report";

export type FindingStatus = "new" | "open" | "resolved";

export interface DiffFinding {
  finding: Finding;
  status: FindingStatus;
}

export interface ScanDiff {
  newCount: number;
  openCount: number;
  resolvedCount: number;
  items: DiffFinding[];
  scoreDelta?: number;
}

function keyOf(f: Finding): string {
  return `${f.type}|${f.title}|${f.path || f.url || ""}`.toLowerCase();
}

export function diffFindings(current: Finding[], previous: Finding[]): ScanDiff {
  const prevMap = new Map(previous.map((f) => [keyOf(f), f]));
  const currMap = new Map(current.map((f) => [keyOf(f), f]));
  const items: DiffFinding[] = [];
  for (const f of current) {
    const k = keyOf(f);
    items.push({ finding: f, status: prevMap.has(k) ? "open" : "new" });
  }
  for (const f of previous) {
    const k = keyOf(f);
    if (!currMap.has(k)) items.push({ finding: f, status: "resolved" });
  }
  return {
    newCount: items.filter((i) => i.status === "new").length,
    openCount: items.filter((i) => i.status === "open").length,
    resolvedCount: items.filter((i) => i.status === "resolved").length,
    items,
  };
}
