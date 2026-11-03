import { NextRequest, NextResponse } from "next/server";
import { domainSchema } from "@/lib/validators";
import { scanLeaks } from "@/lib/scanners/leaks";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyDemoToken, getDemoCookieName, decrementDemoScans } from "@/lib/demo";
import { isDevMode } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = domainSchema.safeParse(body.domain);
    let domain = parsed.success ? parsed.data : "";
    if (!domain && !(isDevMode() && body.domain?.includes("localhost"))) {
      return NextResponse.json({ error: "Dominio non valido" }, { status: 400 });
    }
    if (!domain) domain = body.domain;

    const demoCookie = req.cookies.get(getDemoCookieName())?.value;
    const devSession = req.cookies.get("gw_dev_session")?.value;
    let userId = "anonymous";
    let isDemo = false;
    let scansLeft = 999;

    if (demoCookie) {
      const session = await verifyDemoToken(demoCookie);
      if (!session || session.scansLeft <= 0) {
        return NextResponse.json({ error: "Sessione demo scaduta o scansioni esaurite." }, { status: 403 });
      }
      isDemo = true; scansLeft = session.scansLeft; userId = `demo:${session.code}`;
    } else if (devSession && isDevMode()) {
      userId = devSession;
    } else {
      return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
    }

    const { allowed } = await checkRateLimit(`scan:${userId}`, isDemo ? 3 : 20);
    if (!allowed) return NextResponse.json({ error: "Limite giornaliero raggiunto." }, { status: 429 });

    const result = await scanLeaks(domain);
    let newToken: string | undefined;
    if (isDemo && demoCookie) {
      const dec = await decrementDemoScans(demoCookie);
      if (dec) { newToken = dec.token; scansLeft = dec.session.scansLeft; }
    }

    const res = NextResponse.json({ ...result, isDemo, scansLeft });
    if (newToken) {
      res.cookies.set(getDemoCookieName(), newToken, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24, path: "/",
      });
    }
    return res;
  } catch (e: any) {
    console.error("[scan/leaks]", e);
    return NextResponse.json({ error: e.message || "Errore durante la scansione" }, { status: 500 });
  }
}
