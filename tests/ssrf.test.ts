import { describe, it, expect } from "vitest";
import { assertSafeUrl } from "@/lib/scanners/ssrf";

describe("SSRF protection", () => {
  it("blocks private IPs", async () => {
    await expect(assertSafeUrl("http://127.0.0.1")).rejects.toThrow();
    await expect(assertSafeUrl("http://localhost")).rejects.toThrow();
    await expect(assertSafeUrl("http://192.168.1.1")).rejects.toThrow();
    await expect(assertSafeUrl("http://10.0.0.1")).rejects.toThrow();
    await expect(assertSafeUrl("http://169.254.169.254")).rejects.toThrow();
  });

  it("blocks non-http protocols", async () => {
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toThrow();
  });

  it("blocks unusual ports", async () => {
    await expect(assertSafeUrl("http://example.com:8080")).rejects.toThrow();
  });
});
