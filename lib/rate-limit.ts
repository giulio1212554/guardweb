import { db } from "@/lib/db";
import type { RateLimitEntry } from "@/types/report";

const WINDOWS = {
  demoRedeem: 15 * 60 * 1000,
  scan: 24 * 60 * 60 * 1000,
};

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = WINDOWS.scan
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  let entry = await db.getRateLimit(key);

  if (!entry || now - entry.windowStart > windowMs) {
    entry = { key, count: 0, windowStart: now };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  await db.setRateLimit(entry);
  return { allowed: true, remaining: limit - entry.count };
}

export async function checkDemoRedeemLimit(ip: string): Promise<boolean> {
  const { allowed } = await checkRateLimit(
    `demo-redeem:${ip}`,
    5,
    WINDOWS.demoRedeem
  );
  return allowed;
}
