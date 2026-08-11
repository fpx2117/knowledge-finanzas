import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "@know-finanzas/observability";

describe("buildSecurityHeaders", () => {
  it("always includes the baseline defensive headers", () => {
    const headers = buildSecurityHeaders({ isHttps: false });
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("only includes Strict-Transport-Security over an actual HTTPS connection", () => {
    expect(buildSecurityHeaders({ isHttps: false })["Strict-Transport-Security"]).toBeUndefined();
    expect(buildSecurityHeaders({ isHttps: true })["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains; preload");
  });
});
