import { and, desc, eq, gte, lt } from "drizzle-orm";
import type { Database } from "../client";
import { accounts, categories, transactions } from "../schema";

export function createActivityQueries(database: Database) {
  return {
    listRecentActivity(userId: string, options: { accountId?: string; from?: Date; to?: Date; includeVoided?: boolean; limit?: number } = {}) {
      return database.select({
        id: transactions.id,
        accountId: transactions.accountId,
        accountName: accounts.name,
        accountType: accounts.type,
        currencyCode: transactions.currencyCode,
        type: transactions.type,
        status: transactions.status,
        amount: transactions.amount,
        description: transactions.description,
        merchant: transactions.merchant,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        occurredAt: transactions.occurredAt,
        postedAt: transactions.postedAt,
        voidedAt: transactions.voidedAt,
      }).from(transactions)
        .innerJoin(accounts, and(eq(accounts.id, transactions.accountId), eq(accounts.userId, transactions.userId)))
        .leftJoin(categories, and(eq(categories.id, transactions.categoryId), eq(categories.userId, transactions.userId)))
        .where(and(
          eq(transactions.userId, userId),
          options.accountId ? eq(transactions.accountId, options.accountId) : undefined,
          options.from ? gte(transactions.occurredAt, options.from) : undefined,
          options.to ? lt(transactions.occurredAt, options.to) : undefined,
          options.includeVoided ? undefined : eq(transactions.status, "POSTED"),
        ))
        .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
        .limit(options.limit ?? 5);
    },
  };
}
