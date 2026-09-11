import { describe, expect, it, vi } from "vitest";

import { invalidateKaiCacheForUser, withKaiPortsCache } from "@/features/kai/lib/kai-response-cache";
import type { KaiDataPorts } from "@know-finanzas/kai";

// Minimal fake ports — only the methods the cache actually wraps need to exist for these tests.
function fakePorts(overrides: Partial<KaiDataPorts> = {}): KaiDataPorts {
  return {
    getMonthlySummary: vi.fn(async () => [{ currencyCode: "ARS", income: "100", expense: "50", net: "50" }]),
    getLiquidBalances: vi.fn(async () => []),
    getAccountBalances: vi.fn(async () => []),
    getSpendable: vi.fn(async () => []),
    getCategoryExpenses: vi.fn(async () => null),
    getMerchantExpenses: vi.fn(async () => null),
    getTopExpenseCategories: vi.fn(async () => []),
    getRecentExpenses: vi.fn(async () => []),
    getUpcomingObligations: vi.fn(async () => []),
    getActiveSubscriptions: vi.fn(async () => []),
    getBudgetStatus: vi.fn(async () => []),
    getGoalProgress: vi.fn(async () => []),
    getTopInsight: vi.fn(async () => null),
    getGoalsForAllocation: vi.fn(async () => []),
    getObligationsForPayment: vi.fn(async () => []),
    getAccountsForTransfer: vi.fn(async () => []),
    getCategoriesForEdit: vi.fn(async () => []),
    getInsightsForProactive: vi.fn(async () => []),
    findTransactionToVoid: vi.fn(async () => null),
    ...overrides,
  } as KaiDataPorts;
}

describe("withKaiPortsCache", () => {
  it("caches a read port — a second identical call within the TTL skips the underlying fn", async () => {
    const ports = fakePorts();
    const cached = withKaiPortsCache("user-1", ports);

    await cached.getMonthlySummary({ from: new Date("2026-09-01"), to: new Date("2026-09-30") });
    await cached.getMonthlySummary({ from: new Date("2026-09-01"), to: new Date("2026-09-30") });

    expect(ports.getMonthlySummary).toHaveBeenCalledTimes(1);
  });

  it("does not cache a write-confirmation lookup — always fresh", async () => {
    const ports = fakePorts();
    const cached = withKaiPortsCache("user-2", ports);

    await cached.getObligationsForPayment();
    await cached.getObligationsForPayment();

    expect(ports.getObligationsForPayment).toHaveBeenCalledTimes(2);
  });

  it("different arguments never share a cache entry", async () => {
    const ports = fakePorts();
    const cached = withKaiPortsCache("user-3", ports);

    await cached.getCategoryExpenses({ from: new Date("2026-09-01"), to: new Date("2026-09-30") }, "comida");
    await cached.getCategoryExpenses({ from: new Date("2026-09-01"), to: new Date("2026-09-30") }, "transporte");

    expect(ports.getCategoryExpenses).toHaveBeenCalledTimes(2);
  });

  it("never leaks a cache hit across users", async () => {
    const portsA = fakePorts();
    const portsB = fakePorts();
    const cachedA = withKaiPortsCache("user-4", portsA);
    const cachedB = withKaiPortsCache("user-5", portsB);
    const range = { from: new Date("2026-09-01"), to: new Date("2026-09-30") };

    await cachedA.getMonthlySummary(range);
    await cachedB.getMonthlySummary(range);

    expect(portsA.getMonthlySummary).toHaveBeenCalledTimes(1);
    expect(portsB.getMonthlySummary).toHaveBeenCalledTimes(1);
  });

  it("invalidateKaiCacheForUser forces the next call to hit the underlying fn again", async () => {
    const ports = fakePorts();
    const cached = withKaiPortsCache("user-6", ports);
    const range = { from: new Date("2026-09-01"), to: new Date("2026-09-30") };

    await cached.getMonthlySummary(range);
    invalidateKaiCacheForUser("user-6");
    await cached.getMonthlySummary(range);

    expect(ports.getMonthlySummary).toHaveBeenCalledTimes(2);
  });
});
