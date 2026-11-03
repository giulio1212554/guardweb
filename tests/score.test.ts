import { describe, it, expect } from "vitest";
import { scoreEdgeCases, computeSecurityScore } from "@/lib/scanners/score";

describe("Security score", () => {
  it("perfect score is high", () => {
    const { perfect } = scoreEdgeCases();
    expect(perfect.score).toBeGreaterThanOrEqual(90);
    expect(perfect.grade).toBe("A");
  });

  it("worst score is low", () => {
    const { worst } = scoreEdgeCases();
    expect(worst.score).toBeLessThan(40);
    expect(worst.grade).toBe("F");
  });

  it("score is clamped 0-100", () => {
    const r = computeSecurityScore({
      headers: [],
      httpsRedirect: true,
      validCert: true,
      spfOk: true,
      dmarcOk: true,
      dkimOk: true,
      caaPresent: true,
      issues: [],
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
