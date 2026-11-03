export interface SecurityTxtInput {
  contactEmail: string;
  expires?: Date;
  preferredLanguages?: string[];
  canonical?: string;
  policyUrl?: string;
  acknowledgments?: string;
  encryption?: string;
}

export function generateSecurityTxt(input: SecurityTxtInput): string {
  const expires = input.expires || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const lines: string[] = [
    `Contact: mailto:${input.contactEmail}`,
    `Expires: ${expires.toISOString()}`,
  ];
  if (input.preferredLanguages?.length) {
    lines.push(`Preferred-Languages: ${input.preferredLanguages.join(", ")}`);
  } else {
    lines.push("Preferred-Languages: it, en");
  }
  if (input.canonical) lines.push(`Canonical: ${input.canonical}`);
  if (input.policyUrl) lines.push(`Policy: ${input.policyUrl}`);
  if (input.acknowledgments) lines.push(`Acknowledgments: ${input.acknowledgments}`);
  if (input.encryption) lines.push(`Encryption: ${input.encryption}`);
  lines.push("");
  lines.push("# Generato da GuardWeb");
  lines.push("# Pubblica questo file in: /.well-known/security.txt");
  return lines.join("\n");
}
