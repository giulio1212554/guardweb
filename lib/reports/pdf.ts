import type { SavedReport, Finding } from "@/types/report";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function findingsHtml(findings: Finding[]): string {
  if (!findings.length) return `<p style="color:#16a34a">Nessun finding critico.</p>`;
  return findings.map((f) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:8px 0">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <strong>${esc(f.title)}</strong>
        <span style="font-size:12px;text-transform:uppercase;color:${
          f.severity === "critical" || f.severity === "high" ? "#dc2626" : "#d97706"
        }">${esc(f.severity)}</span>
      </div>
      <p style="margin:6px 0;color:#4b5563;font-size:14px">${esc(f.description)}</p>
      ${f.evidence ? `<code style="font-size:12px;background:#f3f4f6;padding:4px 6px;border-radius:4px;display:block">${esc(f.evidence)}</code>` : ""}
      ${f.remediation ? `<p style="margin:8px 0 0;font-size:13px"><strong>Come risolvere:</strong> ${esc(f.remediation)}</p>` : ""}
    </div>`).join("");
}

export function buildReportHtml(report: SavedReport, opts?: { business?: boolean }): string {
  const date = new Date(report.createdAt).toLocaleString("it-IT");
  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"/><title>Report GuardWeb – ${esc(report.domain)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111}h1{font-size:24px}.meta{color:#6b7280;font-size:14px}.score{font-size:48px;font-weight:700}@media print{.no-print{display:none}}</style></head><body>
<div class="no-print" style="margin-bottom:16px"><button onclick="window.print()" style="padding:10px 16px;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer">Stampa / Salva PDF</button></div>
<h1>Report di sicurezza – ${esc(report.domain)}</h1>
<p class="meta">Generato da GuardWeb il ${esc(date)}${opts?.business ? " · Piano Business" : ""}</p>
${report.score != null ? `<div style="margin:20px 0"><div class="score">${report.score}</div><div>Grade ${esc(report.grade || "–")}</div></div>` : ""}
<p>${esc(report.summary)}</p>
<h2>Leak &amp; credenziali</h2>${findingsHtml(report.leakFindings)}
<h2>Problemi di configurazione</h2>${findingsHtml(report.auditIssues)}
<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb"/>
<p style="font-size:12px;color:#9ca3af">Report generato automaticamente. Non costituisce consulenza legale o di sicurezza certificata.</p>
</body></html>`;
}
