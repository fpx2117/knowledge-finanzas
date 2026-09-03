import { describe, expect, it } from "vitest";

import { createPendingReviewService } from "../../apps/web/src/features/transactions/services/pending-review-service";

const uncat = [
  { id: "t1", description: "MERPAGO YPF", merchant: "YPF", amount: "30000.00", currencyCode: "ARS", occurredAt: new Date("2026-09-01T00:00:00Z") },
  { id: "t2", description: "Kiosco", merchant: null, amount: "1500.00", currencyCode: "ARS", occurredAt: new Date("2026-09-02T00:00:00Z") },
];

function setup() {
  const setCalls: Array<{ id: string; categoryId: string; nodeId: string | null }> = [];
  const service = createPendingReviewService({
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
      findByIdForUser: async (id) =>
        id === "c-fuel" ? { id, type: "EXPENSE", status: "ACTIVE" }
          : id === "c-inc" ? { id, type: "INCOME", status: "ACTIVE" }
            : undefined,
    },
    categoryMap: { resolveNodeForUserCategory: async () => ({ id: "node-fuel" }) },
  });
  return { service, setCalls };
}

describe("pending review service", () => {
  it("returns the uncategorized items, count and active expense categories", async () => {
    const review = await setup().service.getUncategorized("user-a");
    expect(review.count).toBe(5);
    expect(review.items).toHaveLength(2);
    expect(review.items[0]).toMatchObject({ id: "t1", occurredOn: "2026-09-01" });
    expect(review.categoryOptions).toEqual([{ id: "c-fuel", name: "Combustible" }]);
  });

  it("assigns the category and its taxonomy node", async () => {
    const { service, setCalls } = setup();
    await service.categorize("user-a", "t1", "c-fuel");
    expect(setCalls).toEqual([{ id: "t1", categoryId: "c-fuel", nodeId: "node-fuel" }]);
  });

  it("rejects a missing, archived or wrong-type category", async () => {
    const { service } = setup();
    await expect(service.categorize("user-a", "t1", "c-missing")).rejects.toMatchObject({ code: "CATEGORY_NOT_FOUND" });
    await expect(service.categorize("user-a", "t1", "c-inc")).rejects.toMatchObject({ code: "CATEGORY_TYPE_MISMATCH" });
  });
});
