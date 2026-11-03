import { promises as fs } from "fs";
import path from "path";
import type { Profile, DomainRecord, DemoCode, RateLimitEntry, Plan } from "@/types/report";

const DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "guardweb-data")
    : path.join(process.cwd(), ".dev-data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DbShape {
  profiles: Profile[];
  domains: DomainRecord[];
  demo_codes: DemoCode[];
  rate_limits: RateLimitEntry[];
  reports: Array<{ id: string; userId: string; domain: string; type: string; data: unknown; score?: number; createdAt: string }>;
  scan_cache: Array<{ key: string; data: unknown; expiresAt: number }>;
}

const defaultDb: DbShape = {
  profiles: [],
  domains: [],
  demo_codes: [{
    code: "GW-TEST-0000", maxUses: 999, uses: 0, expiresAt: null,
    maxScans: 10, active: true, note: "Codice demo precaricato",
    createdAt: new Date().toISOString(),
  }],
  rate_limits: [], reports: [], scan_cache: [],
};

let memoryDb: DbShape | null = null;

async function ensureDb(): Promise<DbShape> {
  if (memoryDb) return memoryDb;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DB_FILE, "utf-8");
    memoryDb = JSON.parse(raw) as DbShape;
    return memoryDb;
  } catch {
    memoryDb = structuredClone(defaultDb);
    try { await fs.writeFile(DB_FILE, JSON.stringify(memoryDb, null, 2)); } catch {}
    return memoryDb;
  }
}

async function saveDb(db: DbShape): Promise<void> {
  memoryDb = db;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
  } catch {}
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const fileAdapter = {
  async getProfileById(id: string) {
    const db = await ensureDb();
    return db.profiles.find((p) => p.id === id) ?? null;
  },
  async getProfileByEmail(email: string) {
    const db = await ensureDb();
    return db.profiles.find((p) => p.email === email) ?? null;
  },
  async upsertProfile(email: string, plan: Plan = "none") {
    const db = await ensureDb();
    let profile = db.profiles.find((p) => p.email === email);
    if (profile) profile.plan = plan;
    else {
      profile = { id: uid(), email, plan, createdAt: new Date().toISOString() };
      db.profiles.push(profile);
    }
    await saveDb(db);
    return profile;
  },
  async setPlan(userId: string, plan: Plan) {
    const db = await ensureDb();
    const p = db.profiles.find((x) => x.id === userId);
    if (p) { p.plan = plan; await saveDb(db); }
  },
  async getDomain(userId: string, domain: string) {
    const db = await ensureDb();
    return db.domains.find((d) => d.userId === userId && d.domain === domain.toLowerCase()) ?? null;
  },
  async createDomain(userId: string, domain: string, verifyToken: string) {
    const db = await ensureDb();
    const existing = db.domains.find((d) => d.userId === userId && d.domain === domain.toLowerCase());
    if (existing) return existing;
    const rec: DomainRecord = {
      id: uid(), userId, domain: domain.toLowerCase(), verified: false,
      verifyToken, createdAt: new Date().toISOString(),
    };
    db.domains.push(rec);
    await saveDb(db);
    return rec;
  },
  async markDomainVerified(userId: string, domain: string) {
    const db = await ensureDb();
    const d = db.domains.find((x) => x.userId === userId && x.domain === domain.toLowerCase());
    if (d) { d.verified = true; await saveDb(db); }
  },
  async listDemoCodes() { return (await ensureDb()).demo_codes; },
  async getDemoCode(code: string) {
    const db = await ensureDb();
    return db.demo_codes.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null;
  },
  async createDemoCode(data: Omit<DemoCode, "uses" | "createdAt">) {
    const db = await ensureDb();
    const code: DemoCode = { ...data, code: data.code.toUpperCase(), uses: 0, createdAt: new Date().toISOString() };
    db.demo_codes.push(code);
    await saveDb(db);
    return code;
  },
  async incrementDemoUse(code: string) {
    const db = await ensureDb();
    const c = db.demo_codes.find((x) => x.code.toUpperCase() === code.toUpperCase());
    if (c) { c.uses += 1; await saveDb(db); }
  },
  async deactivateDemoCode(code: string) {
    const db = await ensureDb();
    const c = db.demo_codes.find((x) => x.code.toUpperCase() === code.toUpperCase());
    if (c) { c.active = false; await saveDb(db); }
  },
  async getRateLimit(key: string) {
    return (await ensureDb()).rate_limits.find((r) => r.key === key) ?? null;
  },
  async setRateLimit(entry: RateLimitEntry) {
    const db = await ensureDb();
    const idx = db.rate_limits.findIndex((r) => r.key === entry.key);
    if (idx >= 0) db.rate_limits[idx] = entry; else db.rate_limits.push(entry);
    await saveDb(db);
  },
  async getCache(key: string) {
    const db = await ensureDb();
    const item = db.scan_cache.find((c) => c.key === key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      db.scan_cache = db.scan_cache.filter((c) => c.key !== key);
      await saveDb(db);
      return null;
    }
    return item.data;
  },
  async setCache(key: string, data: unknown, ttlMs: number) {
    const db = await ensureDb();
    db.scan_cache = db.scan_cache.filter((c) => c.key !== key);
    db.scan_cache.push({ key, data, expiresAt: Date.now() + ttlMs });
    await saveDb(db);
  },
  async saveReport(userId: string, domain: string, type: string, data: unknown, score?: number) {
    const db = await ensureDb();
    db.reports.push({ id: uid(), userId, domain, type, data, score, createdAt: new Date().toISOString() });
    await saveDb(db);
  },
};
