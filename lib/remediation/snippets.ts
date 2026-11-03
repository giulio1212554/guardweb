export type Stack = "nginx" | "apache" | "vercel" | "cloudflare" | "wordpress" | "generic";

export interface RemediationSnippet {
  id: string;
  title: string;
  stack: Stack;
  findingTypes: string[];
  code: string;
  notes?: string;
}

export const SNIPPETS: RemediationSnippet[] = [
  {
    id: "nginx-hsts",
    title: "HSTS su Nginx",
    stack: "nginx",
    findingTypes: ["Strict-Transport-Security", "header"],
    code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
    notes: "Dentro il blocco server HTTPS.",
  },
  {
    id: "nginx-security-headers",
    title: "Header di sicurezza Nginx",
    stack: "nginx",
    findingTypes: ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options"],
    code: `add_header X-Content-Type-Options "nosniff" always;\nadd_header X-Frame-Options "SAMEORIGIN" always;\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
  },
  {
    id: "apache-headers",
    title: "Header di sicurezza Apache",
    stack: "apache",
    findingTypes: ["Strict-Transport-Security", "X-Content-Type-Options", "header"],
    code: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\nHeader always set X-Content-Type-Options "nosniff"\nHeader always set X-Frame-Options "SAMEORIGIN"`,
    notes: "Richiede mod_headers.",
  },
  {
    id: "vercel-headers",
    title: "Header in vercel.json",
    stack: "vercel",
    findingTypes: ["Strict-Transport-Security", "Content-Security-Policy", "header"],
    code: `{\n  "headers": [{\n    "source": "/(.*)",\n    "headers": [\n      { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },\n      { "key": "X-Content-Type-Options", "value": "nosniff" },\n      { "key": "X-Frame-Options", "value": "SAMEORIGIN" }\n    ]\n  }]\n}`,
  },
  {
    id: "cloudflare-headers",
    title: "Transform Rules Cloudflare",
    stack: "cloudflare",
    findingTypes: ["Strict-Transport-Security", "header"],
    code: `# Dashboard → Rules → Transform Rules → Modify Response Header\n# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload\n# X-Content-Type-Options: nosniff`,
    notes: "Abilita SSL Full (strict) e Always Use HTTPS.",
  },
  {
    id: "wordpress-headers",
    title: "Header WordPress",
    stack: "wordpress",
    findingTypes: ["header", "Strict-Transport-Security"],
    code: `add_action('send_headers', function () {\n  header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');\n  header('X-Content-Type-Options: nosniff');\n  header('X-Frame-Options: SAMEORIGIN');\n});`,
  },
  {
    id: "block-env",
    title: "Blocca /.env (Nginx)",
    stack: "nginx",
    findingTypes: ["exposed_file", ".env"],
    code: `location ~ /\\.env { deny all; return 404; }\nlocation ~ /\\.git { deny all; return 404; }`,
  },
  {
    id: "spf-dmarc",
    title: "SPF + DMARC (DNS)",
    stack: "generic",
    findingTypes: ["spf", "dmarc", "dns"],
    code: `# TXT @\nv=spf1 include:_spf.google.com ~all\n\n# TXT _dmarc\nv=DMARC1; p=quarantine; rua=mailto:dmarc@tuodominio.it; pct=100`,
  },
];

export function snippetsForFinding(title: string, type: string, stack?: Stack): RemediationSnippet[] {
  const q = `${title} ${type}`.toLowerCase();
  return SNIPPETS.filter((s) => {
    if (stack && s.stack !== stack && s.stack !== "generic") return false;
    return s.findingTypes.some((t) => q.includes(t.toLowerCase()));
  });
}
