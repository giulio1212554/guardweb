import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDevMode } from "@/lib/env";
import { getDemoCookieName } from "@/lib/demo";
import { encryptSecret } from "@/lib/crypto-keys";

function getUserId(req: NextRequest): string {
  const dev = req.cookies.get("gw_dev_session")?.value;
  if (dev && isDevMode()) return dev;
  if (req.cookies.get(getDemoCookieName())?.value) return "demo-user";
  return "anonymous";
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (userId === "anonymous") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  const row = await db.getUserSecrets(userId);
  return NextResponse.json({
    hasGithub: !!row?.githubTokenEnc,
    hasHibp: !!row?.hibpKeyEnc,
    alertEmail: row?.alertEmail || "",
  });
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (userId === "anonymous") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    if (userId === "demo-user") {
      return NextResponse.json({ error: "Impostazioni API non disponibili in demo" }, { status: 403 });
    }
    const body = await req.json();
    const patch: {
      githubTokenEnc?: string | null;
      hibpKeyEnc?: string | null;
      alertEmail?: string | null;
    } = {};
    if (body.clearGithub) patch.githubTokenEnc = null;
    else if (typeof body.githubToken === "string" && body.githubToken.trim()) {
      patch.githubTokenEnc = encryptSecret(body.githubToken.trim());
    }
    if (body.clearHibp) patch.hibpKeyEnc = null;
    else if (typeof body.hibpKey === "string" && body.hibpKey.trim()) {
      patch.hibpKeyEnc = encryptSecret(body.hibpKey.trim());
    }
    if (body.alertEmail !== undefined) {
      patch.alertEmail = String(body.alertEmail || "").trim() || null;
    }
    await db.setUserSecrets(userId, patch);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Errore" }, { status: 500 });
  }
}
