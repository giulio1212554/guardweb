import { SignJWT, jwtVerify } from "jose";
import { getDemoJwtSecret } from "@/lib/env";
import type { DemoSession } from "@/types/report";

const COOKIE_NAME = "gw_demo_session";

export function getDemoCookieName() {
  return COOKIE_NAME;
}

export async function createDemoToken(session: Omit<DemoSession, "expiresAt">): Promise<string> {
  const secret = new TextEncoder().encode(getDemoJwtSecret());
  return new SignJWT({
    code: session.code,
    scansLeft: session.scansLeft,
    maxScans: session.maxScans,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(secret);
}

export async function verifyDemoToken(token: string): Promise<DemoSession | null> {
  try {
    const secret = new TextEncoder().encode(getDemoJwtSecret());
    const { payload } = await jwtVerify(token, secret);
    return {
      code: payload.code as string,
      scansLeft: payload.scansLeft as number,
      maxScans: payload.maxScans as number,
      expiresAt: (payload.exp as number) * 1000,
    };
  } catch {
    return null;
  }
}

export async function decrementDemoScans(
  token: string
): Promise<{ token: string; session: DemoSession } | null> {
  const session = await verifyDemoToken(token);
  if (!session || session.scansLeft <= 0) return null;
  const newSession = { ...session, scansLeft: session.scansLeft - 1 };
  const newToken = await createDemoToken(newSession);
  return { token: newToken, session: newSession };
}
