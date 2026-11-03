import type { HeaderCheck, Finding } from "@/types/report";

export function computeSecurityScore(params: {
  headers: HeaderCheck[];
  httpsRedirect: boolean;
  validCert: boolean;
  spfOk: boolean;
  dmarcOk: boolean;
  dkimOk: boolean;
  caaPresent: boolean;
  issues: Finding[];
}): { score: number; grade: "A" | "B" | "C" | "D" | "F" } {
  let score = 100;
  const criticalHeaders = ["Strict-Transport-Security", "Content-Security-Policy", "X-Content-Type-Options"];
  const importantHeaders = ["X-Frame-Options", "Referrer-Policy", "Permissions-Policy"];
  for (const h of params.headers) {
    if (criticalHeaders.includes(h.name) && h.status === "fail") score -= 12;
    else if (importantHeaders.includes(h.name) && h.status === "fail") score -= 6;
    else if (h.name === "Server" || h.name === "X-Powered-By") {
      if (h.present) score -= 3;
    }
  }
  if (!params.httpsRedirect) score -= 15;
  if (!params.validCert) score -= 20;
  if (!params.spfOk) score -= 10;
  if (!params.dmarcOk) score -= 10;
  if (!params.dkimOk) score -= 5;
  if (!params.caaPresent) score -= 3;
  for (const issue of params.issues) {
    if (issue.severity === "critical") score -= 8;
    else if (issue.severity === "high") score -= 4;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  let grade: "A" | "B" | "C" | "D" | "F";
  if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";
  return { score, grade };
}

export function scoreEdgeCases() {
  return {
    perfect: computeSecurityScore({
      headers: [], httpsRedirect: true, validCert: true,
      spfOk: true, dmarcOk: true, dkimOk: true, caaPresent: true, issues: [],
    }),
    worst: computeSecurityScore({
      headers: [
        { name: "Strict-Transport-Security", present: false, status: "fail", message: "" },
        { name: "Content-Security-Policy", present: false, status: "fail", message: "" },
        { name: "X-Content-Type-Options", present: false, status: "fail", message: "" },
      ],
      httpsRedirect: false, validCert: false, spfOk: false, dmarcOk: false,
      dkimOk: false, caaPresent: false,
      issues: [
        { id: "1", severity: "critical", type: "test", title: "t", description: "d" },
        { id: "2", severity: "critical", type: "test", title: "t", description: "d" },
      ],
    }),
  };
}
