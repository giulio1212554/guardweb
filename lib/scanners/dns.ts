import { resolve4, resolve6, resolveMx, resolveNs, resolveTxt, resolveCaa } from "node:dns/promises";
import type { DnsRecord } from "@/types/report";

export interface DnsAuditResult {
  records: DnsRecord[];
  spf: { present: boolean; record?: string; status: string };
  dmarc: { present: boolean; record?: string; status: string };
  dkim: { found: string[]; status: string };
  caa: { present: boolean; records: string[] };
}

const DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "dkim", "mail"];

export async function auditDns(domain: string): Promise<DnsAuditResult> {
  const records: DnsRecord[] = [];
  let spf = { present: false, record: undefined as string | undefined, status: "assente" };
  let dmarc = { present: false, record: undefined as string | undefined, status: "assente" };
  let dkim = { found: [] as string[], status: "nessun selettore trovato" };
  let caa = { present: false, records: [] as string[] };

  try { const a = await resolve4(domain).catch(() => []); if (a.length) records.push({ type: "A", values: a }); } catch {}
  try { const aaaa = await resolve6(domain).catch(() => []); if (aaaa.length) records.push({ type: "AAAA", values: aaaa }); } catch {}
  try {
    const mx = await resolveMx(domain).catch(() => []);
    if (mx.length) records.push({ type: "MX", values: mx.map((m) => `${m.priority} ${m.exchange}`) });
  } catch {}
  try { const ns = await resolveNs(domain).catch(() => []); if (ns.length) records.push({ type: "NS", values: ns }); } catch {}
  try {
    const txt = await resolveTxt(domain).catch(() => []);
    const flat = txt.map((t) => t.join(""));
    if (flat.length) records.push({ type: "TXT", values: flat });
    const spfRec = flat.find((t) => t.toLowerCase().startsWith("v=spf1"));
    if (spfRec) spf = { present: true, record: spfRec, status: spfRec.includes("-all") || spfRec.includes("~all") ? "ok" : "debole" };
  } catch {}
  try {
    const dmarcTxt = await resolveTxt(`_dmarc.${domain}`).catch(() => []);
    const flat = dmarcTxt.map((t) => t.join(""));
    const dmarcRec = flat.find((t) => t.toLowerCase().startsWith("v=dmarc1"));
    if (dmarcRec) dmarc = { present: true, record: dmarcRec, status: /p\s*=\s*(reject|quarantine)/i.test(dmarcRec) ? "ok" : "policy debole" };
  } catch {}
  const found: string[] = [];
  for (const sel of DKIM_SELECTORS) {
    try {
      const dkimTxt = await resolveTxt(`${sel}._domainkey.${domain}`).catch(() => []);
      const flat = dkimTxt.map((t) => t.join(""));
      if (flat.some((t) => t.toLowerCase().includes("v=dkim1") || t.includes("p="))) found.push(sel);
    } catch {}
  }
  if (found.length) dkim = { found, status: `trovati: ${found.join(", ")}` };
  try {
    const caaRecs = await resolveCaa(domain).catch(() => []);
    if (caaRecs.length) caa = { present: true, records: caaRecs.map((c) => `${c.critical} ${c.issue || c.issuewild || ""}`) };
  } catch {}
  return { records, spf, dmarc, dkim, caa };
}
