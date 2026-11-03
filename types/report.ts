export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  id: string;
  severity: Severity;
  type: string;
  title: string;
  description: string;
  evidence?: string;
  url?: string;
  path?: string;
  remediation?: string;
}

export interface LeakScanResult {
  domain: string;
  findings: Finding[];
  githubChecked: boolean;
  githubMessage?: string;
  filesChecked: string[];
  subdomains: string[];
  scannedAt: string;
}

export interface HeaderCheck {
  name: string;
  present: boolean;
  value?: string;
  status: "ok" | "warn" | "fail" | "info";
  message: string;
  remediation?: string;
}

export interface DnsRecord {
  type: string;
  values: string[];
}

export interface AuditScanResult {
  domain: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  headers: HeaderCheck[];
  https: {
    redirects: boolean;
    validCert: boolean;
    expiresAt?: string;
    daysLeft?: number;
  };
  dns: {
    records: DnsRecord[];
    spf: { present: boolean; record?: string; status: string };
    dmarc: { present: boolean; record?: string; status: string };
    dkim: { found: string[]; status: string };
    caa: { present: boolean; records: string[] };
  };
  issues: Finding[];
  scannedAt: string;
}

export type Plan = "none" | "pro" | "business";

export interface Profile {
  id: string;
  email: string;
  plan: Plan;
  createdAt: string;
}

export interface DomainRecord {
  id: string;
  userId: string;
  domain: string;
  verified: boolean;
  verifyToken: string;
  createdAt: string;
}

export interface DemoCode {
  code: string;
  maxUses: number;
  uses: number;
  expiresAt: string | null;
  maxScans: number;
  active: boolean;
  note?: string;
  createdAt: string;
}

export interface DemoSession {
  code: string;
  scansLeft: number;
  maxScans: number;
  expiresAt: number;
}

export interface RateLimitEntry {
  key: string;
  count: number;
  windowStart: number;
}
