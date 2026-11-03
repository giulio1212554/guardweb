import { assertSafeUrl } from "./ssrf";
import { findSecrets, isEnvLike, isGitConfigLike } from "./secrets";
import { db } from "@/lib/db";
import { hasGithubToken, isDevMode } from "@/lib/env";
import type { Finding, LeakScanResult } from "@/types/report";
import { maskSecret } from "@/lib/utils";

const SENSITIVE_PATHS = ["/.env", "/.env.local", "/.git/config", "/backup.zip", "/phpinfo.php", "/wp-config.php.bak", "/.DS_Store"];

async function checkExposedFile(baseUrl: string, path: string): Promise<Finding | null> {
  try {
    const url = new URL(path, baseUrl).toString();
    await assertSafeUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "GuardWeb-Scanner/1.0" } });
    clearTimeout(timeout);
    if (!res.ok || res.status === 404) return null;
    const text = await res.text();
    if (text.length > 500_000) return null;
    let isInteresting = false;
    let severity: Finding["severity"] = "high";
    let title = `File esposto: ${path}`;
    if (path.includes(".env") && isEnvLike(text)) { isInteresting = true; severity = "critical"; title = "File .env esposto pubblicamente"; }
    else if (path.includes(".git/config") && isGitConfigLike(text)) { isInteresting = true; severity = "critical"; title = "Repository Git esposto"; }
    else if (path.includes("phpinfo") && text.toLowerCase().includes("php version")) { isInteresting = true; }
    else if (path.includes("backup") || path.endsWith(".bak")) { isInteresting = true; }
    else if (path.includes(".DS_Store") && text.length > 10) { isInteresting = true; severity = "medium"; }
    if (!isInteresting) return null;
    const secrets = findSecrets(text);
    const evidenceParts = secrets.slice(0, 3).map((s) => `${s.type}: ${s.evidence}`);
    if (secrets.length === 0) evidenceParts.push(text.slice(0, 80).replace(/\n/g, " ") + "…");
    return {
      id: `file-${path}`, severity, type: "exposed_file", title,
      description: `Il percorso ${path} è accessibile pubblicamente.`,
      evidence: evidenceParts.join(" | "), url, path,
      remediation: "Rimuovi il file dal web root e ruota le credenziali esposte.",
    };
  } catch { return null; }
}

export async function scanLeaks(domain: string): Promise<LeakScanResult> {
  const isLocal = isDevMode() && domain.includes("localhost");
  const effectiveBase = isLocal ? "http://localhost:4000" : `https://${domain}`;
  await assertSafeUrl(effectiveBase);
  const findings: Finding[] = [];
  const filesChecked: string[] = [];
  for (const p of SENSITIVE_PATHS) {
    filesChecked.push(p);
    const f = await checkExposedFile(effectiveBase, p);
    if (f) findings.push(f);
  }
  return {
    domain: domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0],
    findings, githubChecked: hasGithubToken(), filesChecked, subdomains: [], scannedAt: new Date().toISOString(),
  };
}
