import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDevMode } from "@/lib/env";
import { getDemoCookieName } from "@/lib/demo";

function getUserId(req: NextRequest): string {
  const dev = req.cookies.get("gw_dev_session")?.value;
  if (dev && isDevMode()) return dev;
  if (req.cookies.get(getDemoCookieName())?.value) return "demo-user";
  return "anonymous";
}

function maxDomains(userId: string): number {
  if (userId.includes("business")) return 5;
  if (userId.includes("pro")) return 1;
  return 1;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (userId === "anonymous") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  const domains = await db.listDomains(userId);
  return NextResponse.json({
    domains,
    limit: maxDomains(userId),
    used: domains.length,
  });
}
