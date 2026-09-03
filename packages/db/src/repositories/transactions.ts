import { and, desc, eq, gte, lte, notInArray, sql } from "drizzle-orm";
import Decimal from "decimal.js";

import type { Database } from "../client";
import { transactions } from "../schema";

export function createTransactionRepository(database: Database) {
  return {
    create(input: {
      userId: string; accountId: string; categoryId: string | null;
      type: "INCOME" | "EXPENSE" | "REFUND" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"; amount: string; currencyCode: string;
      description: string; merchant: string | null; merchantId?: string | null;
      taxonomyNodeId?: string | null;
      paymentMethod?: "CASH" | "DEBIT" | "CREDIT" | "TRANSFER" | "WALLET" | "OTHER" | null;
      classification?: unknown;
      occurredAt: Date;
      postedAt: Date; source: "MANUAL"; notes: string | null; originalTransactionId?: string | null; relatedTransactionId?: string | null; reason?: string | null;
    }) {
      return database.insert(transactions).values({ ...input, status: "POSTED" }).returning().then(([transaction]) => transaction);
    },

    /**
     * How many times this user has already had a non-voided expense for this merchant land
     * on this taxonomy node — the evidence that a merchant→category classification is
     * trusted (progressive trust, #13 / spec §44).
     */
    countClassifiedForMerchantNode(userId: string, merchantId: string, taxonomyNodeId: string) {
      return database
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.merchantId, merchantId),
          eq(transactions.taxonomyNodeId, taxonomyNodeId),
          eq(transactions.type, "EXPENSE"),
          eq(transactions.status, "POSTED"),
        ))
        .then(([row]) => row?.count ?? 0);
    },

    findByIdForUser(transactionId: string, userId: string) {
      return database.select().from(transactions)
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
        .limit(1)
        .then(([transaction]) => transaction);
    },

    listForUser(userId: string, options: { accountId?: string; categoryId?: string; type?: "INCOME" | "EXPENSE"; from?: Date; to?: Date; limit?: number; offset?: number } = {}) {
      return database.select().from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          notInArray(transactions.type, ["TRANSFER_IN", "TRANSFER_OUT"]),
          options.accountId ? eq(transactions.accountId, options.accountId) : undefined,
          options.categoryId ? eq(transactions.categoryId, options.categoryId) : undefined,
          options.type ? eq(transactions.type, options.type) : undefined,
          options.from ? gte(transactions.occurredAt, options.from) : undefined,
          options.to ? lte(transactions.occurredAt, options.to) : undefined,
        ))
        .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
        .limit(options.limit ?? 50)
        .offset(options.offset ?? 0);
    },

    updateMetadataForUser(transactionId: string, userId: string, input: { description: string; merchant: string | null; categoryId: string | null; notes: string | null }) {
      return database.update(transactions).set({ ...input, updatedAt: new Date() })
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId), eq(transactions.status, "POSTED")))
        .returning().then(([transaction]) => transaction);
    },

    voidForUser(transactionId: string, userId: string, voidedAt: Date) {
      return database.update(transactions).set({ status: "VOIDED", voidedAt, updatedAt: voidedAt })
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId), eq(transactions.status, "POSTED")))
        .returning().then(([transaction]) => transaction);
    },

    sumPostedRefundsForOriginal(originalTransactionId: string, userId: string) {
      return database.select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.originalTransactionId, originalTransactionId), eq(transactions.type, "REFUND"), eq(transactions.status, "POSTED")))
        .then(([row]) => row?.total ?? "0");
    },

    createRefundAtomic(input: { userId: string; accountId: string; originalTransactionId: string; amount: string; currencyCode: string; description: string; occurredAt: Date; postedAt: Date; source: "MANUAL"; notes: string | null; categoryId: string | null }) {
      return database.transaction(async (tx) => {
        const [original] = await tx.select().from(transactions).where(and(eq(transactions.id, input.originalTransactionId), eq(transactions.userId, input.userId))).for("update");
        if (!original || original.type !== "EXPENSE" || original.status !== "POSTED" || original.accountId !== input.accountId || original.currencyCode !== input.currencyCode) return undefined;
        const [total] = await tx.select({ value: sql<string>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions).where(and(eq(transactions.originalTransactionId, original.id), eq(transactions.userId, input.userId), eq(transactions.type, "REFUND"), eq(transactions.status, "POSTED")));
        if (new Decimal(total?.value ?? "0").plus(input.amount).gt(original.amount)) return undefined;
        return tx.insert(transactions).values({ ...input, type: "REFUND", status: "POSTED" }).returning().then(([transaction]) => transaction);
      });
    },
  };
}
