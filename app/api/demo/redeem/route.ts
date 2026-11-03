import { NextRequest, NextResponse } from "next/server";
import { demoCodeSchema } from "@/lib/validators";
import { db } from "@/lib/db";
import { createDemoToken, getDemoCookieName } from "@/lib/demo";
import { checkDemoRedeemLimit } from "@/lib/rate-limit";
import { isDevMode } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const allowed = await checkDemoRedeemLimit(ip);
    if (!allowed) return NextResponse.json({ error: "Troppi tentativi. Riprova tra 15 minuti." }, { status: 429 });

    const body = await req.json();
    const parsed = demoCodeSchema.safeParse(body.code?.toUpperCase());
    if (!parsed.success) return NextResponse.json({ error: "Formato codice non valido (GW-XXXX-XXXX)" }, { status: 400 });
    const code = parsed.data.toUpperCase();

    let demo = await db.getDemoCode(code);
    if (!demo && isDevMode() && code === "GW-TEST-0000") {
      demo = await db.createDemoCode({
        code: "GW-TEST-0000", maxUses: 999, expiresAt: null, maxScans: 10, active: true, note: "Auto-creato in DEV",
      });
    }
    if (!demo) return NextResponse.json({ error: "Codice non valido" }, { status: 404 });
    if (!demo.active) return NextResponse.json({ error: "Codice disattivato" }, { status: 400 });
    if (demo.expiresAt && new Date(demo.expiresAt) < new Date()) return NextResponse.json({ error: "Codice scaduto" }, { status: 400 });
    if (demo.uses >= demo.maxUses) return NextResponse.json({ error: "Codice esaurito" }, { status: 400 });

    await db.incrementDemoUse(code);
    const token = await createDemoToken({ code: demo.code, scansLeft: demo.maxScans, maxScans: demo.maxScans });
    const res = NextResponse.json({ ok: true, scansLeft: demo.maxScans, message: `Codice attivato. Hai ${demo.maxScans} scansioni.` });
    res.cookies.set(getDemoCookieName(), token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24, path: "/",
    });
    return res;
  } catch (e: any) {
    console.error("[demo/redeem]", e);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
