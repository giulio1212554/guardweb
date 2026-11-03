import type { Profile, DomainRecord, DemoCode, Plan, RateLimitEntry } from "@/types/report";

function notConfigured(): never {
  throw new Error("Supabase non configurato. Usa la modalita locale (DEV_MODE).");
}

export const supabaseAdapter = {
  async getProfileById(_id: string): Promise<Profile | null> { notConfigured(); },
  async getProfileByEmail(_email: string): Promise<Profile | null> { notConfigured(); },
  async upsertProfile(_email: string, _plan?: Plan): Promise<Profile> { notConfigured(); },
  async setPlan(_userId: string, _plan: Plan): Promise<void> { notConfigured(); },
  async getDomain(_userId: string, _domain: string): Promise<DomainRecord | null> { notConfigured(); },
  async createDomain(_userId: string, _domain: string, _verifyToken: string): Promise<DomainRecord> { notConfigured(); },
  async markDomainVerified(_userId: string, _domain: string): Promise<void> { notConfigured(); },
  async listDemoCodes(): Promise<DemoCode[]> { notConfigured(); },
  async getDemoCode(_code: string): Promise<DemoCode | null> { notConfigured(); },
  async createDemoCode(_data: Omit<DemoCode, "uses" | "createdAt">): Promise<DemoCode> { notConfigured(); },
  async incrementDemoUse(_code: string): Promise<void> { notConfigured(); },
  async deactivateDemoCode(_code: string): Promise<void> { notConfigured(); },
  async getRateLimit(_key: string): Promise<RateLimitEntry | null> { notConfigured(); },
  async setRateLimit(_entry: RateLimitEntry): Promise<void> { notConfigured(); },
  async getCache(_key: string): Promise<unknown | null> { notConfigured(); },
  async setCache(_key: string, _data: unknown, _ttlMs: number): Promise<void> { notConfigured(); },
  async saveReport(_userId: string, _domain: string, _type: string, _data: unknown, _score?: number): Promise<void> { notConfigured(); },
};
