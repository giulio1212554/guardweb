import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDevMode } from "@/lib/env";
import { getDemoCookieName } from "@/lib/demo";
import { buildReportHtml } from "@/lib/reports/pdf";
import type { SavedReport } from "@/types/report";

function getUserId(req: NextRequest): string {
  const dev = req.cookies.get("gw_dev_session")?.value;
  if (dev && isDevMode()) return dev;
  if (req.cookies.get(getDemoCookieName())?.value) return "demo-user";
  return "anonymous";
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = getUserId(req);
  if (userId === "anonymous") return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  const row = await db.getReport(userId, id);
  if (!row) return NextResponse.json({ error: "Report non trovato" }, { status: 404 });
  const format = req.nextUrl.searchParams.get("format");
  const data = row.data as SavedReport;
  const report: SavedReport = {
    ...data, id: row.id, userId: row.userId, domain: row.domain,
    score: row.score ?? data.score, createdAt: row.createdAt,
  };
  const isBusiness = userId.includes("business") || (req.cookies.get("gw_dev_session")?.value || "").includes("business");
  if (format === "html" || format === "pdf") {
    if (!isBusiness && !isDevMode()) {
      return NextResponse.json({ error: "Export PDF disponibile sul piano Business" }, { status: 403 });
    }
    const html = buildReportHtml(report, { business: true });
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="guardweb-${report.domain}.html"`,
      },
    });
  }
  return NextResponse.json({ report });
}
