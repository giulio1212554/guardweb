export interface PrivacyPolicyInput {
  companyName: string;
  vatNumber: string;
  address: string;
  privacyEmail: string;
  dataTypes: string[];
  hasAnalytics: boolean;
  hasMarketing: boolean;
  thirdParties: string[];
  securityEmail: string;
  languages: string[];
  policyUrl?: string;
}

export function generatePrivacyPolicy(input: PrivacyPolicyInput): string {
  const dataList = input.dataTypes.length
    ? input.dataTypes.map((d) => `• ${d}`).join("\n")
    : "• Dati di navigazione\n• Dati di contatto forniti volontariamente";
  return `# Informativa Privacy – ${input.companyName}

**AVVISO**: bozza generata da GuardWeb. Da far rivedere a un professionista.

### Titolare
**${input.companyName}** – P.IVA: ${input.vatNumber}
Sede: ${input.address}
Email privacy: ${input.privacyEmail}
Email sicurezza: ${input.securityEmail}

### Dati trattati
${dataList}

### Diritti
Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione.
Reclamo: Garante Privacy (www.garanteprivacy.it).

Generato il ${new Date().toLocaleDateString("it-IT")} da GuardWeb.`;
}
