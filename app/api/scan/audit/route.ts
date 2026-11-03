import { NextRequest, NextResponse } from "next/server";
import { domainSchema } from "@/lib/validators";
import { assertSafeUrl } from "@/lib/scanners/ssrf";
import { analyzeHeaders } from "@/lib/scanners/headers";
import { auditDns } from "@/lib/scanners/dns";
import { computeSecurityScore } from "@/lib/scanners/score";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyDemoToken, getDemoCookieName, decrementDemoScans } from "@/lib/demo";
import { isDevMode } from "@/lib/env";
import type { Finding, AuditScanResult } from "@/types/report";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = domainSchema.safeParse(body.domain?.replace(/^https?:\/\//, "").split("/")[0]);
    let domain = parsed.success ? parsed.data : "";
    if (!domain && !(isDevMode() && body.domain?.includes("localhost"))) {
      return NextResponse.json({ error: "Dominio non valido" }, { status: 400 });
    }
    if (!domain) domain = "localhost:4000";
    const isLocal = isDevMode() && domain.includes("localhost");
    const targetUrl = isLocal ? "http://localhost:4000" : `https://${domain}`;

    const demoCookie = req.cookies.get(getDemoCookieName())?.value;
    const devSession = req.cookies.get("gw_dev_session")?.value;
    let userId = "anonymous";
    let isDemo = false;
    let scansLeft = 999;
    if (demoCookie) {
      const session = await verifyDemoToken(demoCookie);
      if (!session || session.scansLeft <= 0) return NextResponse.json({ error: "Sessione demo esaurita" }, { status: 403 });
      isDemo = true; scansLeft = session.scansLeft; userId = `demo:${session.code}`;
    } else if (devSession && isDevMode()) {
      userId = devSession;
    } else {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { allowed } = await checkRateLimit(`scan:${userId}`, isDemo ? 3 : 20);
    if (!allowed) return NextResponse.json({ error: "Rate limit raggiunto" }, { status: 429 });

    await assertSafeUrl(targetUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let res: Response;
    let finalUrl = targetUrl;
    try {
      res = await fetch(targetUrl, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "GuardWeb-Scanner/1.0" } });
      finalUrl = res.url;
    } finally { clearTimeout(timeout); }

    const headers = analyzeHeaders(res.headers, finalUrl);
    const httpsRedirect = finalUrl.startsWith("https://") || isLocal;
    const dns = isLocal
      ? { records: [], spf: { present: false, status: "n/a" }, dmarc: { present: false, status: "n/a" }, dkim: { found: [], status: "n/a" }, caa: { present: false, records: [] } }
      : await auditDns(domain);

    const issues: Finding[] = headers.filter((h) => h.status === "fail" || h.status === "warn").map((h, i) => ({
      id: `hdr-${i}`, severity: h.status === "fail" ? "high" : "medium", type: "header",
      title: h.name, description: h.message, remediation: h.remediation,
    }));

    const { score, grade } = computeSecurityScore({
      headers, httpsRedirect, validCert: true,
      spfOk: dns.spf.present && dns.spf.status === "ok",
      dmarcOk: dns.dmarc.present && dns.dmarc.status === "ok",
      dkimOk: dns.dkim.found.length > 0, caaPresent: dns.caa.present, issues,
    });

    let newToken: string | undefined;
    if (isDemo && demoCookie) {
      const dec = await decrementDemoScans(demoCookie);
      if (dec) { newToken = dec.token; scansLeft = dec.session.scansLeft; }
    }

    const result: AuditScanResult = {
      domain, score, grade, headers,
      https: { redirects: httpsRedirect, validCert: true },
      dns, issues, scannedAt: new Date().toISOString(),
    };
    const response = NextResponse.json({ ...result, isDemo, scansLeft });
    if (newToken) {
      response.cookies.set(getDemoCookieName(), newToken, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24, path: "/",
      });
    }
    return response;
  } catch (e: any) {
    console.error("[scan/audit]", e);
    return NextResponse.json({ error: e.message || "Errore durante l'audit" }, { status: 500 });
  }
}
