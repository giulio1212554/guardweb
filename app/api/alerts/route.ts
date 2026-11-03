import { NextRequest, NextResponse } from "next/server";
import { sendAlertEmail, buildCriticalAlertHtml } from "@/lib/alerts/email";
import type { Finding } from "@/types/report";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim();
    const domain = String(body.domain || "");
    const findings = (body.findings || []) as Finding[];
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email non valida" }, { status: 400 });
    }
    const critical = findings.filter((f) => f.severity === "critical" || f.severity === "high");
    if (!critical.length) {
      return NextResponse.json({ ok: true, skipped: true, reason: "Nessun finding critico" });
    }
    const result = await sendAlertEmail({
      to: email,
      subject: `[GuardWeb] Alert critici su ${domain}`,
      html: buildCriticalAlertHtml(domain, critical),
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
