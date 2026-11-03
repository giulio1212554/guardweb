import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Plan } from "@/types/report";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Webhook non configurato" }, { status: 500 });
  }
  let event: any;
  try { event = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const plan = (session?.metadata?.plan || "pro") as Plan;
    const email = session?.customer_email || session?.customer_details?.email;
    if (email && (plan === "pro" || plan === "business")) {
      await db.upsertProfile(email, plan);
    }
  }
  return NextResponse.json({ received: true });
}
