import type { Finding } from "@/types/report";

export async function sendAlertEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL || "GuardWeb <onboarding@resend.dev>";
  if (!key) {
    console.log("[alert:email:dry-run]", params.to, params.subject);
    return { ok: false, reason: "RESEND_API_KEY non configurata" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [params.to], subject: params.subject, html: params.html }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, reason: t };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}

export function buildCriticalAlertHtml(domain: string, findings: Finding[]): string {
  const items = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 10)
    .map((f) => `<li><strong>${f.title}</strong> – ${f.description}</li>`)
    .join("");
  return `<h2>Alert sicurezza – ${domain}</h2><p>Finding critici o high:</p><ul>${items}</ul><p>Accedi a GuardWeb per i dettagli.</p>`;
}
