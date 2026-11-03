import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDevMode } from "@/lib/env";
import { getDemoCookieName, verifyDemoToken } from "@/lib/demo";
import type { SavedReport, Finding } from "@/types/report";

function getUserId(req: NextRequest): string {
  const dev = req.cookies.get("gw_dev_session")?.value;
  if (dev && isDevMode()) return dev;
  if (req.cookies.get(getDemoCookieName())?.value) return "demo-user";
  return "anonymous";
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (userId === "anonymous") return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  const reports = await db.listReports(userId);
  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id, domain: r.domain, score: r.score, createdAt: r.createdAt, type: r.type,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (userId === "anonymous") return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    const demoCookie = req.cookies.get(getDemoCookieName())?.value;
    if (demoCookie) {
      const session = await verifyDemoToken(demoCookie);
      if (session) {
        return NextResponse.json({ error: "In demo i report non sono salvabili. Passa a Pro." }, { status: 403 });
      }
    }
    const body = await req.json();
    const domain = String(body.domain || "").toLowerCase();
    const leakFindings = (body.leakFindings || []) as Finding[];
    const auditIssues = (body.auditIssues || []) as Finding[];
    const score = body.score as number | undefined;
    const grade = body.grade as string | undefined;
    const critical = [...leakFindings, ...auditIssues].filter(
      (f) => f.severity === "critical" || f.severity === "high"
    ).length;
    const summary = critical > 0
      ? `Trovati ${critical} rischi ad alta priorità su ${domain}.`
      : `Nessun rischio critico rilevato su ${domain}.`;
    const data: SavedReport = {
      id: "", userId, domain, score, grade, leakFindings, auditIssues, summary,
      createdAt: new Date().toISOString(),
    };
    await db.saveReport(userId, domain, "full", data, score);
    const list = await db.listReports(userId);
    return NextResponse.json({ ok: true, id: list[0]?.id, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Errore" }, { status: 500 });
  }
}
