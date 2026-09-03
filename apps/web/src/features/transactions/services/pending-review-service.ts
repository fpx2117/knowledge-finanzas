import { ApplicationError } from "@know-finanzas/shared";

type UncategorizedRow = {
  id: string;
  description: string;
  merchant: string | null;
  amount: string;
  currencyCode: string;
  occurredAt: Date;
};

type Dependencies = {
  transactions: {
    listUncategorizedForUser(userId: string, limit?: number): Promise<UncategorizedRow[]>;
    countUncategorizedForUser(userId: string): Promise<number>;
    setCategoryForUser(id: string, userId: string, categoryId: string, taxonomyNodeId: string | null): Promise<unknown>;
  };
  categories: {
    listForUser(userId: string, options?: { type?: "INCOME" | "EXPENSE" }): Promise<Array<{ id: string; name: string; type: "INCOME" | "EXPENSE"; status: "ACTIVE" | "ARCHIVED" }>>;
    findByIdForUser(id: string, userId: string): Promise<{ id: string; type: "INCOME" | "EXPENSE"; status: "ACTIVE" | "ARCHIVED" } | undefined>;
  };
  categoryMap?: { resolveNodeForUserCategory(categoryId: string, userId: string): Promise<{ id: string } | undefined> };
};

export type PendingReview = {
  count: number;
  items: Array<{ id: string; description: string; merchant: string | null; amount: string; currencyCode: string; occurredOn: string }>;
  categoryOptions: Array<{ id: string; name: string }>;
};

export function createPendingReviewService({ transactions, categories, categoryMap }: Dependencies) {
  return {
    async getUncategorized(userId: string, limit = 50): Promise<PendingReview> {
      const [items, count, categoryList] = await Promise.all([
        transactions.listUncategorizedForUser(userId, limit),
        transactions.countUncategorizedForUser(userId),
        categories.listForUser(userId, { type: "EXPENSE" }),
      ]);
      return {
        count,
        items: items.map((r) => ({
          id: r.id,
          description: r.description,
          merchant: r.merchant,
          amount: r.amount,
          currencyCode: r.currencyCode,
          occurredOn: r.occurredAt.toISOString().slice(0, 10),
        })),
        categoryOptions: categoryList.filter((c) => c.status === "ACTIVE").map((c) => ({ id: c.id, name: c.name })),
      };
    },

    async categorize(userId: string, transactionId: string, categoryId: string) {
      const category = await categories.findByIdForUser(categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND", { field: "categoryId" });
      if (category.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED", { field: "categoryId" });
      if (category.type !== "EXPENSE") throw new ApplicationError("CATEGORY_TYPE_MISMATCH", { field: "categoryId" });

      const node = await categoryMap?.resolveNodeForUserCategory(categoryId, userId).catch(() => undefined);
      const updated = await transactions.setCategoryForUser(transactionId, userId, categoryId, node?.id ?? null);
      if (!updated) throw new ApplicationError("TRANSACTION_NOT_FOUND");
      return updated;
    },
  };
}
