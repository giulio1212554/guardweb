import type { HeaderCheck } from "@/types/report";

export function analyzeHeaders(headers: Headers, finalUrl: string): HeaderCheck[] {
  const get = (name: string) => headers.get(name) || undefined;
  const checks: HeaderCheck[] = [];

  const hsts = get("strict-transport-security");
  if (!hsts) {
    checks.push({ name: "Strict-Transport-Security", present: false, status: "fail",
      message: "Header HSTS assente. Il browser non forza HTTPS.",
      remediation: "Aggiungi: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload" });
  } else {
    const maxAge = /max-age=(\d+)/i.exec(hsts);
    const age = maxAge ? parseInt(maxAge[1], 10) : 0;
    checks.push({ name: "Strict-Transport-Security", present: true, value: hsts,
      status: age < 15552000 ? "warn" : "ok",
      message: age < 15552000 ? `max-age troppo basso (${age}s)` : "HSTS configurato correttamente." });
  }

  const csp = get("content-security-policy");
  checks.push(csp
    ? { name: "Content-Security-Policy", present: true, value: csp.slice(0, 120), status: "ok", message: "CSP presente." }
    : { name: "Content-Security-Policy", present: false, status: "fail", message: "CSP assente.", remediation: "Definisci una CSP restrittiva." });

  const xcto = get("x-content-type-options");
  checks.push(xcto?.toLowerCase() === "nosniff"
    ? { name: "X-Content-Type-Options", present: true, value: xcto, status: "ok", message: "Corretto." }
    : { name: "X-Content-Type-Options", present: !!xcto, status: "fail", message: "Manca nosniff.", remediation: "X-Content-Type-Options: nosniff" });

  const xfo = get("x-frame-options");
  const hasFA = csp?.toLowerCase().includes("frame-ancestors");
  checks.push((xfo || hasFA)
    ? { name: "X-Frame-Options", present: true, value: xfo || "(via CSP)", status: "ok", message: "Protezione clickjacking presente." }
    : { name: "X-Frame-Options", present: false, status: "fail", message: "Nessuna protezione clickjacking.", remediation: "X-Frame-Options: DENY" });

  const rp = get("referrer-policy");
  checks.push(rp
    ? { name: "Referrer-Policy", present: true, value: rp, status: "ok", message: "Configurata." }
    : { name: "Referrer-Policy", present: false, status: "warn", message: "Assente.", remediation: "Referrer-Policy: strict-origin-when-cross-origin" });

  const server = get("server");
  if (server) checks.push({ name: "Server", present: true, value: server, status: "warn", message: `Rivela: ${server}`, remediation: "Rimuovi o genericizza l'header Server." });
  const xpb = get("x-powered-by");
  if (xpb) checks.push({ name: "X-Powered-By", present: true, value: xpb, status: "warn", message: `Rivela: ${xpb}`, remediation: "Disabilita X-Powered-By." });

  return checks;
}
