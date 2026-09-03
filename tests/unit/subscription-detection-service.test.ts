import { describe, expect, it } from "vitest";

import { createSubscriptionDetectionService } from "../../apps/web/src/features/transactions/services/subscription-detection-service";

const NOW = new Date("2026-09-20T12:00:00Z");
const monthly = ["2026-03-05", "2026-04-04", "2026-05-05", "2026-06-05", "2026-07-06", "2026-08-05", "2026-09-04"];

function expense(over: Record<string, unknown> = {}) {
  return {
    merchantId: "m-netflix",
    merchant: "Netflix",
    description: "Netflix",
    amount: "18499.00",
    currencyCode: "ARS",
    occurredAt: new Date("2026-03-05T12:00:00Z"),
    categoryId: "cat-streaming",
    ...over,
  };
}

function fakeRepo(seed: Array<Record<string, unknown>> = []) {
  let rows = seed.map((r, i) => ({ id: `sub${i}`, status: "ACTIVE", priceHistory: [], ...r })) as Array<Record<string, unknown>>;
  return {
    rows: () => rows,
    listForUser: async (_u: string, status?: string | string[]) => {
      const allowed = status ? (Array.isArray(status) ? status : [status]) : null;
      return rows.filter((r) => !allowed || allowed.includes(r.status as string)) as never;
    },
    upsert: async (input: Record<string, unknown>) => {
      const existing = rows.find((r) => r.merchantId === input.merchantId && r.currencyCode === input.currencyCode);
      if (existing) {
        if (existing.status !== "DISMISSED") Object.assign(existing, input, { status: "ACTIVE", confidence: String(input.confidence) });
        return existing;
      }
      const row = { id: `sub${rows.length}`, status: "ACTIVE", ...input, confidence: String(input.confidence) };
      rows.push(row);
      return row;
    },
    deactivateMissing: async (_u: string, keep: string[]) => {
      for (const r of rows) if (r.status === "ACTIVE" && !keep.includes(r.merchantId as string)) r.status = "INACTIVE";
    },
    setStatusForUser: async (id: string, _u: string, status: string) => {
      const row = rows.find((r) => r.id === id);
      if (row) row.status = status;
      return row as never;
    },
    dismissedMerchantIds: async () => rows.filter((r) => r.status === "DISMISSED").map((r) => r.merchantId as string),
  };
}

function setup(options: { expenses: Array<Record<string, unknown>>; seed?: Array<Record<string, unknown>> }) {
  const subs = fakeRepo(options.seed);
  const service = createSubscriptionDetectionService({
    transactions: { listExpensesSinceForUser: async () => options.expenses as never },
    subscriptions: subs as never,
    categories: { listForUser: async () => [{ id: "cat-streaming", name: "Streaming" }] },
    now: () => NOW,
  });
  return { subs, service };
}

describe("subscription detection service", () => {
  it("detects a subscription and stores it ACTIVE with price history", async () => {
    const { subs, service } = setup({
      expenses: monthly.map((d, i) => expense({ occurredAt: new Date(`${d}T12:00:00Z`), amount: i < 4 ? "18499.00" : "21999.00" })),
    });
    const result = await service.refreshForUser("user-a");
    expect(result.found).toBe(1);
    expect(subs.rows()[0]).toMatchObject({ merchantId: "m-netflix", status: "ACTIVE", currentAmount: "21999.00" });
    expect((subs.rows()[0].priceHistory as unknown[]).length).toBe(2);
  });

  it("surfaces the price change and yearly impact in the list", async () => {
    const { service } = setup({
      expenses: monthly.map((d, i) => expense({ occurredAt: new Date(`${d}T12:00:00Z`), amount: i < 4 ? "18499.00" : "21999.00" })),
    });
    await service.refreshForUser("user-a");
    const [view] = await service.listSubscriptions("user-a");
    expect(view.categoryName).toBe("Streaming");
    expect(view.priceChange).toMatchObject({ from: "18499.00", to: "21999.00" });
    expect(view.priceChange?.yearlyImpact).toBeCloseTo((21999 - 18499) * 12);
  });

  it("never re-adds a dismissed subscription", async () => {
    const { service, subs } = setup({
      expenses: monthly.map((d) => expense({ occurredAt: new Date(`${d}T12:00:00Z`) })),
      seed: [{ merchantId: "m-netflix", currencyCode: "ARS", status: "DISMISSED", label: "Netflix", frequency: "MONTHLY", currentAmount: "18499", firstChargedOn: "2026-03-05", lastChargedOn: "2026-09-04", nextExpectedOn: "2026-10-04", chargeCount: 7, confidence: "0.9" }],
    });
    const result = await service.refreshForUser("user-a");
    expect(result.found).toBe(0);
    expect(subs.rows().every((r) => r.status === "DISMISSED")).toBe(true);
  });

  it("deactivates a subscription that is no longer detected", async () => {
    const { service, subs } = setup({
      expenses: [],
      seed: [{ merchantId: "m-gone", currencyCode: "ARS", status: "ACTIVE", label: "Viejo", frequency: "MONTHLY", currentAmount: "5000", firstChargedOn: "2026-01-01", lastChargedOn: "2026-03-01", nextExpectedOn: "2026-04-01", chargeCount: 3, confidence: "0.7" }],
    });
    await service.refreshForUser("user-a");
    expect(subs.rows()[0].status).toBe("INACTIVE");
  });

  it("dismiss moves a subscription out of the list", async () => {
    const { service } = setup({ expenses: monthly.map((d) => expense({ occurredAt: new Date(`${d}T12:00:00Z`) })) });
    await service.refreshForUser("user-a");
    const [s] = await service.listSubscriptions("user-a");
    await service.dismissSubscription("user-a", s.id);
    expect(await service.listSubscriptions("user-a")).toHaveLength(0);
  });
});
