import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scanLeaks } from "@/lib/scanners/leaks";
import { assertSafeUrl } from "@/lib/scanners/ssrf";
import { analyzeHeaders } from "@/lib/scanners/headers";
import { auditDns } from "@/lib/scanners/dns";
import { computeSecurityScore } from "@/lib/scanners/score";
import { diffFindings } from "@/lib/monitoring/diff";
import { sendAlertEmail, buildCriticalAlertHtml } from "@/lib/alerts/email";
import type { Finding, SavedReport } from "@/types/report";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIds = ["pro-user", "business-user", "admin"];
  const results: any[] = [];

  for (const userId of userIds) {
    let domains: Awaited<ReturnType<typeof db.listDomains>> = [];
    try {
      domains = await db.listDomains(userId);
    } catch {
      continue;
    }
    for (const d of domains.filter((x) => x.verified)) {
      try {
        const domain = d.domain;
        const isLocal = domain.includes("localhost");
        const targetUrl = isLocal ? "http://localhost:4000" : `https://${domain}`;
        await assertSafeUrl(targetUrl);

        const leak = await scanLeaks(domain);
        let score = 0;
        let grade = "F";
        let issues: Finding[] = [];

        if (!isLocal) {
          const res = await fetch(targetUrl, {
            method: "GET",
            redirect: "follow",
            signal: AbortSignal.timeout(8000),
            headers: { "User-Agent": "GuardWeb-Monitor/1.0" },
          });
          const headersResult = analyzeHeaders(res.headers, res.url);
          const dns = await auditDns(domain);
          issues = headersResult
            .filter((h) => h.status === "fail" || h.status === "warn")
            .map((h, i) => ({
              id: `hdr-${i}`,
              severity: (h.status === "fail" ? "high" : "medium") as Finding["severity"],
              type: "header",
              title: h.name,
              description: h.message,
              remediation: h.remediation,
            }));
          const scored = computeSecurityScore({
            headers: headersResult,
            httpsRedirect: res.url.startsWith("https://"),
            validCert: true,
            spfOk: dns.spf.present && dns.spf.status === "ok",
            dmarcOk: dns.dmarc.present && dns.dmarc.status === "ok",
            dkimOk: dns.dkim.found.length > 0,
            caaPresent: dns.caa.present,
            issues,
          });
          score = scored.score;
          grade = scored.grade;
        }

        const currentFindings = [...leak.findings, ...issues];
        const prevReports = await db.listReports(userId);
        const last = prevReports.find((r) => r.domain === domain);
        const prevData = last?.data as SavedReport | undefined;
        const previous = [
          ...(prevData?.leakFindings || []),
          ...(prevData?.auditIssues || []),
        ];
        const diff = diffFindings(currentFindings, previous);
        if (score != null && last?.score != null) diff.scoreDelta = score - last.score;

        const summary =
          diff.newCount > 0
            ? `Monitor: ${diff.newCount} nuovi finding su ${domain}`
            : `Monitor: nessun nuovo finding su ${domain}`;

        await db.saveReport(
          userId,
          domain,
          "monitor",
          {
            id: "",
            userId,
            domain,
            score,
            grade,
            leakFindings: leak.findings,
            auditIssues: issues,
            summary,
            createdAt: new Date().toISOString(),
            diff,
          } as any,
          score
        );

        try {
          const secrets = await db.getUserSecrets(userId);
          if (secrets?.alertEmail && diff.newCount > 0) {
            const news = diff.items.filter((i) => i.status === "new").map((i) => i.finding);
            await sendAlertEmail({
              to: secrets.alertEmail,
              subject: `[GuardWeb] Nuovi finding su ${domain}`,
              html: buildCriticalAlertHtml(domain, news),
            });
          }
        } catch {}

        results.push({ domain, userId, ...diff, score });
      } catch (e: any) {
        results.push({ domain: d.domain, error: e.message });
      }
    }
  }

  return NextResponse.json({ ok: true, results, at: new Date().toISOString() });
}
