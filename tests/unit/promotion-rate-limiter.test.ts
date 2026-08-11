import { describe, expect, it } from "vitest";
import { createInMemoryRateLimiter } from "@know-finanzas/promotions";

describe("createInMemoryRateLimiter", () => {
  it("allows up to the configured limit within the window, then blocks", async () => {
    const checkRateLimit = createInMemoryRateLimiter({ limit: 3, windowMs: 60_000 });

    expect(await checkRateLimit("user:1")).toBe(true);
    expect(await checkRateLimit("user:1")).toBe(true);
    expect(await checkRateLimit("user:1")).toBe(true);
    expect(await checkRateLimit("user:1")).toBe(false);
  });

  it("tracks keys independently", async () => {
    const checkRateLimit = createInMemoryRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(await checkRateLimit("user:1")).toBe(true);
    expect(await checkRateLimit("ip:1.2.3.4")).toBe(true);
    expect(await checkRateLimit("user:1")).toBe(false);
    expect(await checkRateLimit("ip:1.2.3.4")).toBe(false);
  });

  it("resets once the window elapses", async () => {
    let now = 0;
    const checkRateLimit = createInMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => now });

    expect(await checkRateLimit("user:1")).toBe(true);
    expect(await checkRateLimit("user:1")).toBe(false);

    now = 1001;
    expect(await checkRateLimit("user:1")).toBe(true);
  });
});
