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
  recurring: { listSuggestions(userId: string): Promise<unknown[]> };
  subscriptions: { listSubscriptions(userId: string): Promise<Array<{ label: string; status: string; priceChange: { from: string; to: string; yearlyImpact: number } | null }>> };
  duplicates: { scanForUser(userId: string): Promise<unknown[]> };
};

export type InboxSummary = {
  uncategorized: {
    count: number;
    items: Array<{ id: string; description: string; merchant: string | null; amount: string; currencyCode: string; occurredOn: string }>;
  };
  categoryOptions: Array<{ id: string; name: string }>;
  recurringSuggestions: number;
  activeSubscriptions: number;
  priceIncreases: Array<{ label: string; from: string; to: string; yearlyImpact: number; currencyCode: string }>;
  duplicatePairs: number;
  total: number;
};

export function createInboxService({ transactions, categories, categoryMap, recurring, subscriptions, duplicates }: Dependencies) {
  return {
    async getSummary(userId: string): Promise<InboxSummary> {
      const [uncatItems, uncatCount, categoryList, recurringList, subList, dupPairs] = await Promise.all([
        transactions.listUncategorizedForUser(userId, 30),
        transactions.countUncategorizedForUser(userId),
        categories.listForUser(userId, { type: "EXPENSE" }),
        recurring.listSuggestions(userId),
        subscriptions.listSubscriptions(userId),
        duplicates.scanForUser(userId).catch(() => []),
      ]);

      const priceIncreases = subList
        .filter((s) => s.priceChange && Number(s.priceChange.to) > Number(s.priceChange.from))
        .map((s) => ({ label: s.label, from: s.priceChange!.from, to: s.priceChange!.to, yearlyImpact: s.priceChange!.yearlyImpact, currencyCode: "ARS" }));

      const summary: InboxSummary = {
        uncategorized: {
          count: uncatCount,
          items: uncatItems.map((r) => ({
            id: r.id,
            description: r.description,
            merchant: r.merchant,
            amount: r.amount,
            currencyCode: r.currencyCode,
            occurredOn: r.occurredAt.toISOString().slice(0, 10),
          })),
        },
        categoryOptions: categoryList.filter((c) => c.status === "ACTIVE").map((c) => ({ id: c.id, name: c.name })),
        recurringSuggestions: recurringList.length,
        activeSubscriptions: subList.filter((s) => s.status === "ACTIVE").length,
        priceIncreases,
        duplicatePairs: dupPairs.length,
        total: 0,
      };
      summary.total = uncatCount + recurringList.length + priceIncreases.length + dupPairs.length;
      return summary;
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
