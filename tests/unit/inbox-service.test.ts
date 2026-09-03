import { describe, expect, it } from "vitest";

import { createInboxService } from "../../apps/web/src/features/transactions/services/inbox-service";

const uncat = [
  { id: "t1", description: "MERPAGO YPF", merchant: "YPF", amount: "30000.00", currencyCode: "ARS", occurredAt: new Date("2026-09-01T00:00:00Z") },
  { id: "t2", description: "Kiosco", merchant: null, amount: "1500.00", currencyCode: "ARS", occurredAt: new Date("2026-09-02T00:00:00Z") },
];

function setup(over: Partial<Parameters<typeof createInboxService>[0]> = {}) {
  const setCalls: Array<{ id: string; categoryId: string; nodeId: string | null }> = [];
  const service = createInboxService({
    transactions: {
      listUncategorizedForUser: async () => uncat,
      countUncategorizedForUser: async () => 5,
      setCategoryForUser: async (id, _u, categoryId, nodeId) => { setCalls.push({ id, categoryId, nodeId }); return { id }; },
    },
    categories: {
      listForUser: async () => [
        { id: "c-fuel", name: "Combustible", type: "EXPENSE", status: "ACTIVE" },
        { id: "c-old", name: "Vieja", type: "EXPENSE", status: "ARCHIVED" },
      ],
      findByIdForUser: async (id) => (id === "c-fuel" ? { id, type: "EXPENSE", status: "ACTIVE" } : id === "c-inc" ? { id, type: "INCOME", status: "ACTIVE" } : undefined),
    },
    categoryMap: { resolveNodeForUserCategory: async () => ({ id: "node-fuel" }) },
    recurring: { listSuggestions: async () => [{}, {}] },
    subscriptions: { listSubscriptions: async () => [
      { label: "Netflix", status: "ACTIVE", priceChange: { from: "18499.00", to: "21999.00", yearlyImpact: 42000 } },
      { label: "Spotify", status: "ACTIVE", priceChange: null },
      { label: "HBO", status: "INACTIVE", priceChange: null },
    ] },
    duplicates: { scanForUser: async () => [{}, {}, {}] },
    ...over,
  });
  return { service, setCalls };
}

describe("inbox service — summary", () => {
  it("aggregates the actionable counts", async () => {
    const summary = await setup().service.getSummary("user-a");
    expect(summary).toMatchObject({
      uncategorized: { count: 5 },
      recurringSuggestions: 2,
      activeSubscriptions: 2,
      duplicatePairs: 3,
    });
    expect(summary.uncategorized.items).toHaveLength(2);
    expect(summary.priceIncreases).toEqual([{ label: "Netflix", from: "18499.00", to: "21999.00", yearlyImpact: 42000, currencyCode: "ARS" }]);
    expect(summary.total).toBe(5 + 2 + 1 + 3);
  });

  it("only offers active expense categories", async () => {
    const summary = await setup().service.getSummary("user-a");
    expect(summary.categoryOptions).toEqual([{ id: "c-fuel", name: "Combustible" }]);
  });

  it("survives a failing duplicate scan", async () => {
    const summary = await setup({ duplicates: { scanForUser: async () => { throw new Error("boom"); } } }).service.getSummary("user-a");
    expect(summary.duplicatePairs).toBe(0);
  });
});

describe("inbox service — categorize", () => {
  it("assigns the category and its taxonomy node", async () => {
    const { service, setCalls } = setup();
    await service.categorize("user-a", "t1", "c-fuel");
    expect(setCalls).toEqual([{ id: "t1", categoryId: "c-fuel", nodeId: "node-fuel" }]);
  });

  it("rejects an archived, missing or wrong-type category", async () => {
    const { service } = setup();
    await expect(service.categorize("user-a", "t1", "c-missing")).rejects.toMatchObject({ code: "CATEGORY_NOT_FOUND" });
    await expect(service.categorize("user-a", "t1", "c-inc")).rejects.toMatchObject({ code: "CATEGORY_TYPE_MISMATCH" });
  });
});
