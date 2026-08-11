import { describe, expect, it } from "vitest";
import { createInMemoryRateLimiter } from "@know-finanzas/ai";

describe("createInMemoryRateLimiter", () => {
  it("allows requests up to the limit within the window", async () => {
    const now = 0;
    const checkRateLimit = createInMemoryRateLimiter({ limit: 2, windowMs: 1000, now: () => now });

    await expect(checkRateLimit({ userId: "user-1", capability: "transaction.categorize" })).resolves.toBe(true);
    await expect(checkRateLimit({ userId: "user-1", capability: "transaction.categorize" })).resolves.toBe(true);
    await expect(checkRateLimit({ userId: "user-1", capability: "transaction.categorize" })).resolves.toBe(false);
  });

  it("keys by (userId, capability) independently — one user/capability being limited never blocks another", async () => {
    const checkRateLimit = createInMemoryRateLimiter({ limit: 1, windowMs: 1000 });

    await expect(checkRateLimit({ userId: "user-1", capability: "transaction.categorize" })).resolves.toBe(true);
    await expect(checkRateLimit({ userId: "user-1", capability: "merchant.normalize" })).resolves.toBe(true);
    await expect(checkRateLimit({ userId: "user-2", capability: "transaction.categorize" })).resolves.toBe(true);
    await expect(checkRateLimit({ userId: "user-1", capability: "transaction.categorize" })).resolves.toBe(false);
  });

  it("allows requests again once the window has elapsed", async () => {
    let now = 0;
    const checkRateLimit = createInMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => now });

    await expect(checkRateLimit({ userId: "user-1", capability: "transaction.categorize" })).resolves.toBe(true);
    await expect(checkRateLimit({ userId: "user-1", capability: "transaction.categorize" })).resolves.toBe(false);

    now = 1500;
    await expect(checkRateLimit({ userId: "user-1", capability: "transaction.categorize" })).resolves.toBe(true);
  });
});
