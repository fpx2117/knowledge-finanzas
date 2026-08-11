import { describe, expect, it } from "vitest";
import { createBoundedInMemoryRateLimiter } from "@know-finanzas/observability";

describe("createBoundedInMemoryRateLimiter", () => {
  it("allows requests under the limit and denies once the limit is reached within the window", async () => {
    let now = 0;
    const checkRateLimit = createBoundedInMemoryRateLimiter({ limit: 3, windowMs: 1000, now: () => now });

    expect(await checkRateLimit("ip:1.2.3.4")).toBe(true);
    expect(await checkRateLimit("ip:1.2.3.4")).toBe(true);
    expect(await checkRateLimit("ip:1.2.3.4")).toBe(true);
    expect(await checkRateLimit("ip:1.2.3.4")).toBe(false);
  });

  it("allows again once the window slides past the earlier hits", async () => {
    let now = 0;
    const checkRateLimit = createBoundedInMemoryRateLimiter({ limit: 2, windowMs: 1000, now: () => now });

    expect(await checkRateLimit("k")).toBe(true);
    expect(await checkRateLimit("k")).toBe(true);
    expect(await checkRateLimit("k")).toBe(false);

    now = 1001;
    expect(await checkRateLimit("k")).toBe(true);
  });

  it("tracks keys independently", async () => {
    let now = 0;
    const checkRateLimit = createBoundedInMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => now });

    expect(await checkRateLimit("a")).toBe(true);
    expect(await checkRateLimit("b")).toBe(true);
    expect(await checkRateLimit("a")).toBe(false);
    expect(await checkRateLimit("b")).toBe(false);
  });

  it("evicts the least-recently-touched key once maxTrackedKeys is exceeded, never growing unbounded", async () => {
    let now = 0;
    const checkRateLimit = createBoundedInMemoryRateLimiter({ limit: 5, windowMs: 100_000, maxTrackedKeys: 2, now: () => now });

    await checkRateLimit("first");
    await checkRateLimit("second");
    await checkRateLimit("third");

    // "first" was evicted to make room for "third" — it gets a clean slate (all 5 of its limit
    // available again), proving eviction actually happened rather than just capping growth.
    for (let i = 0; i < 5; i += 1) expect(await checkRateLimit("first")).toBe(true);
  });
});
