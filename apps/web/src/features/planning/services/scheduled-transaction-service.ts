import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { createScheduledTransactionRepository } from "@know-finanzas/db/repositories";
import type { Database } from "@know-finanzas/db/client";
import { accounts, categories, scheduledTransactions, transactions } from "@know-finanzas/db/schema";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "../../../lib/billing/product-access-gate";

export function createScheduledTransactionService(database: Database, now = () => new Date(), gate: ProductAccessGate = allowAllProductAccessGate) {
  return {
    async create(userId: string, input: { accountId: string; type: "INCOME" | "EXPENSE"; expectedAmount: string; description: string; categoryId?: string; scheduledDate: string; notes?: string }) {
      await gate.assertCanWrite(userId);
      const account = await database.select().from(accounts).where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId))).limit(1).then(([row]) => row);
      if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND"); if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED");
      const category = input.categoryId ? await database.select().from(categories).where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId))).limit(1).then(([row]) => row) : undefined;
      if (input.categoryId && !category) throw new ApplicationError("CATEGORY_NOT_FOUND"); if (category && (category.status === "ARCHIVED" || category.type !== input.type)) throw new ApplicationError("CATEGORY_TYPE_MISMATCH");
      return createScheduledTransactionRepository(database).create({ userId, accountId: account.id, type: input.type, expectedAmount: input.expectedAmount, currencyCode: account.currencyCode, description: input.description.trim(), categoryId: category?.id ?? null, scheduledDate: input.scheduledDate, notes: input.notes?.trim() || null });
    },
    list(userId: string, includeTerminal = false) { return createScheduledTransactionRepository(database).listForUser(userId, { includeTerminal }); },
    async update(userId: string, id: string, input: { accountId: string; type: "INCOME" | "EXPENSE"; expectedAmount: string; description: string; categoryId: string | null; scheduledDate: string; notes: string | null }) { const repository = createScheduledTransactionRepository(database); const current = await repository.findByIdForUser(id, userId); if (!current || current.status !== "SCHEDULED") throw new ApplicationError("INVALID_INPUT"); return repository.updateForUser(id, userId, { ...input, currencyCode: current.currencyCode }); },
    async skip(userId: string, id: string) { const result = await createScheduledTransactionRepository(database).transitionForUser(id, userId, "SKIPPED", now()); if (!result) throw new ApplicationError("INVALID_INPUT"); return result; },
    async cancel(userId: string, id: string) { const result = await createScheduledTransactionRepository(database).transitionForUser(id, userId, "CANCELLED", now()); if (!result) throw new ApplicationError("INVALID_INPUT"); return result; },
    async post(userId: string, id: string, input: { actualAmount?: string; actualOccurredAt?: Date } = {}) {
      await gate.assertCanWrite(userId);
      return database.transaction(async (tx) => {
        const repository = createScheduledTransactionRepository(tx as unknown as Database);
        const scheduled = await repository.findByIdForUser(id, userId, true);
        if (!scheduled) throw new ApplicationError("INVALID_INPUT");
        if (scheduled.status === "POSTED" && scheduled.postedTransactionId) return tx.select().from(transactions).where(eq(transactions.id, scheduled.postedTransactionId)).limit(1).then(([transaction]) => transaction);
        if (scheduled.status !== "SCHEDULED") throw new ApplicationError("INVALID_INPUT");
        const [account] = await tx.select().from(accounts).where(and(eq(accounts.id, scheduled.accountId), eq(accounts.userId, userId))).for("update");
        if (!account || account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED");
        const occurredAt = input.actualOccurredAt ?? now();
        if (Number.isNaN(occurredAt.getTime()) || occurredAt > now()) throw new ApplicationError("INVALID_INPUT", { field: "actualOccurredAt" });
        const transactionId = randomUUID();
        const [transaction] = await tx.insert(transactions).values({ id: transactionId, userId, accountId: account.id, type: scheduled.type, status: "POSTED", amount: input.actualAmount ?? scheduled.expectedAmount, currencyCode: account.currencyCode, description: scheduled.description, categoryId: scheduled.categoryId, scheduledTransactionId: scheduled.id, occurredAt, postedAt: now(), source: "SCHEDULED", notes: scheduled.notes, merchant: null, transferId: null, originalTransactionId: null, relatedTransactionId: null, reason: null, metadata: null, voidedAt: null }).returning();
        await tx.update(scheduledTransactions).set({ status: "POSTED", postedTransactionId: transaction.id, actualAmount: transaction.amount, actualOccurredAt: occurredAt, updatedAt: now() }).where(and(eq(scheduledTransactions.id, scheduled.id), eq(scheduledTransactions.userId, userId), eq(scheduledTransactions.status, "SCHEDULED")));
        return transaction;
      });
    },
  };
}
