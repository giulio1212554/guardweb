import { describe, it, expect } from "vitest";
import { generateSecurityTxt } from "@/lib/generators/security-txt";

describe("security.txt generator", () => {
  it("produces RFC 9116 compliant output", () => {
    const txt = generateSecurityTxt({
      contactEmail: "security@example.it",
      preferredLanguages: ["it", "en"],
      canonical: "https://example.it/.well-known/security.txt",
    });
    expect(txt).toContain("Contact: mailto:security@example.it");
    expect(txt).toContain("Expires:");
    expect(txt).toContain("Preferred-Languages: it, en");
    expect(txt).toContain("Canonical:");
  });
});
