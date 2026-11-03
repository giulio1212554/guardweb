import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, hasStripe } from "@/lib/stripe";
import { isDevMode } from "@/lib/env";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = body.plan as "pro" | "business";
    if (plan !== "pro" && plan !== "business") {
      return NextResponse.json({ error: "Piano non valido" }, { status: 400 });
    }
    if (isDevMode() && (body.mock === true || !hasStripe())) {
      const email = body.email || `${plan}@test.local`;
      await db.upsertProfile(email, plan);
      const res = NextResponse.json({
        ok: true, mock: true,
        message: `Piano ${plan} attivato (simulazione DEV)`,
        redirect: "/onboarding",
      });
      res.cookies.set("gw_dev_session", `${plan}-user`, {
        path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax",
      });
      return res;
    }
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createCheckoutSession({
      plan,
      customerEmail: body.email,
      successUrl: `${origin}/onboarding?checkout=success&plan=${plan}`,
      cancelUrl: `${origin}/pricing?checkout=cancel`,
      clientReferenceId: body.userId,
    });
    if ("error" in session) {
      return NextResponse.json({ error: session.error, mock: session.mock }, { status: 400 });
    }
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Errore" }, { status: 500 });
  }
}
