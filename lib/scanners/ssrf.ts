import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isDevMode } from "@/lib/env";

const BLOCKED_HOSTS = new Set([
  "localhost", "127.0.0.1", "0.0.0.0", "::1",
  "metadata.google.internal", "169.254.169.254",
]);

const PRIVATE_RANGES = [
  /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^127\./, /^169\.254\./, /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,
];

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
  return PRIVATE_RANGES.some((re) => re.test(ip));
}

export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new Error("URL non valido");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Solo protocolli http/https ammessi");
  }
  const hostname = url.hostname.toLowerCase();
  if (isDevMode() && hostname === "localhost" && url.port === "4000") {
    return url;
  }
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error("Host bloccato per sicurezza (SSRF)");
  }
  const port = url.port ? parseInt(url.port, 10) : url.protocol === "https:" ? 443 : 80;
  if (port !== 80 && port !== 443) {
    throw new Error("Solo porte 80 e 443 ammesse");
  }
  let addresses: string[] = [];
  if (isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      const res = await lookup(hostname, { all: true });
      addresses = res.map((r) => r.address);
    } catch {
      throw new Error(`Impossibile risolvere il dominio: ${hostname}`);
    }
  }
  for (const ip of addresses) {
    if (isPrivateIp(ip)) {
      throw new Error(`IP privato/bloccato rilevato: ${ip}`);
    }
  }
  return url;
}
