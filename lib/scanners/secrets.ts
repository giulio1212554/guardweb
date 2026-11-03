import { maskSecret } from "@/lib/utils";

export interface SecretMatch {
  type: string;
  severity: "critical" | "high" | "medium";
  evidence: string;
  pattern: string;
}

const PATTERNS: Array<{ name: string; re: RegExp; severity: "critical" | "high" | "medium" }> = [
  { name: "AWS Access Key", re: /AKIA[0-9A-Z]{16}/g, severity: "critical" },
  { name: "Stripe Live Key", re: /sk_live_[0-9a-zA-Z]{24,}/g, severity: "critical" },
  { name: "GitHub Token", re: /ghp_[0-9a-zA-Z]{36}/g, severity: "critical" },
  { name: "Google API Key", re: /AIza[0-9A-Za-z\-_]{35}/g, severity: "high" },
  { name: "Supabase Service Role", re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, severity: "critical" },
  { name: "Generic JWT", re: /eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, severity: "medium" },
  { name: "Private Key Header", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, severity: "critical" },
];

export function findSecrets(text: string): SecretMatch[] {
  const matches: SecretMatch[] = [];
  const seen = new Set<string>();
  for (const p of PATTERNS) {
    const found = text.match(p.re) || [];
    for (const m of found) {
      const key = `${p.name}:${m.slice(0, 12)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({ type: p.name, severity: p.severity, evidence: maskSecret(m, 4), pattern: p.name });
    }
  }
  return matches;
}

export function isEnvLike(content: string): boolean {
  const lines = content.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (lines.length < 1) return false;
  return lines.filter((l) => /^[A-Z0-9_]+=.+/.test(l.trim())).length >= 1;
}

export function isGitConfigLike(content: string): boolean {
  return content.includes("[core]") || content.includes("[remote");
}
