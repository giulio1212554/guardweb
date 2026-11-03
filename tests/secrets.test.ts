import { describe, it, expect } from "vitest";
import { findSecrets, isEnvLike, isGitConfigLike } from "@/lib/scanners/secrets";
import { maskSecret } from "@/lib/utils";

describe("secrets", () => {
  it("masks secrets", () => {
    expect(maskSecret("AKIAFAKEFAKEFAKE1234")).toMatch(/AKIA\*+1234/);
  });
  it("detects AWS keys", () => {
    const matches = findSecrets("key=AKIAFAKEFAKEFAKE1234");
    expect(matches.some((m) => m.type.includes("AWS"))).toBe(true);
  });
  it("detects env-like content", () => {
    expect(isEnvLike("AWS_KEY=AKIA123\nDB_URL=postgres://x")).toBe(true);
    expect(isEnvLike("<html>hello</html>")).toBe(false);
  });
  it("detects git config", () => {
    expect(isGitConfigLike("[core]\n\trepositoryformatversion = 0")).toBe(true);
  });
});
