import { todayInTimezone, generateOccurrenceDates } from "@know-finanzas/finance";
import { createRecurringTransactionRepository } from "@know-finanzas/db/repositories";
import { accounts, categories } from "@know-finanzas/db/schema";
import type { Database } from "@know-finanzas/db/client";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "../../../lib/billing/product-access-gate";

function addDays(date: string, days: number) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
export function createRecurringTransactionService(database: Database, now = () => new Date(), gate: ProductAccessGate = allowAllProductAccessGate) {
  return {
    async create(user: { id: string; timezone: string }, input: { accountId: string; type: "INCOME" | "EXPENSE"; amount: string; description: string; categoryId?: string; frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"; startDate: string; endDate?: string; occurrenceCount?: number; anchorDay?: number; notes?: string }) {
      await gate.assertCanWrite(user.id);
      const account = await database.select().from(accounts).where(and(eq(accounts.id, input.accountId), eq(accounts.userId, user.id))).limit(1).then(([row]) => row);
      if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND"); if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED");
      const category = input.categoryId ? await database.select().from(categories).where(and(eq(categories.id, input.categoryId), eq(categories.userId, user.id))).limit(1).then(([row]) => row) : undefined;
      if (input.categoryId && !category) throw new ApplicationError("CATEGORY_NOT_FOUND"); if (category && (category.status === "ARCHIVED" || category.type !== input.type)) throw new ApplicationError("CATEGORY_TYPE_MISMATCH");
      const today = todayInTimezone(now(), user.timezone); const through = addDays(today, 90); const dates = generateOccurrenceDates({ ...input, from: today, through });
      return database.transaction(async (tx) => { const repository = createRecurringTransactionRepository(tx as unknown as Database); const rule = await repository.create({ id: randomUUID(), userId: user.id, accountId: account.id, type: input.type, amount: input.amount, currencyCode: account.currencyCode, description: input.description.trim(), categoryId: category?.id ?? null, frequency: input.frequency, startDate: input.startDate, endDate: input.endDate ?? null, occurrenceCount: input.occurrenceCount ?? null, anchorDay: input.anchorDay ?? Number(input.startDate.slice(8, 10)), nextOccurrence: dates[0] ?? null, status: "ACTIVE", notes: input.notes?.trim() || null }); for (const [index, date] of dates.entries()) await repository.insertOccurrence({ id: randomUUID(), userId: user.id, accountId: account.id, type: input.type, expectedAmount: input.amount, currencyCode: account.currencyCode, description: input.description.trim(), categoryId: category?.id ?? null, scheduledDate: date, status: "SCHEDULED", source: "RECURRING", recurringTransactionId: rule.id, occurrenceNumber: index + 1, notes: input.notes?.trim() || null }); return rule; });
    },
    list(userId: string) { return createRecurringTransactionRepository(database).listForUser(userId); },
    async pause(userId: string, id: string) { const repository = createRecurringTransactionRepository(database); const rule = await repository.findByIdForUser(id, userId); if (!rule) throw new ApplicationError("INVALID_INPUT"); return database.update(recurringTransactions).set({ status: "PAUSED", updatedAt: now() }).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId))).returning().then(([item]) => item); },
    async resume(userId: string, id: string) { const repository = createRecurringTransactionRepository(database); const rule = await repository.findByIdForUser(id, userId); if (!rule || rule.status !== "PAUSED") throw new ApplicationError("INVALID_INPUT"); return database.update(recurringTransactions).set({ status: "ACTIVE", updatedAt: now() }).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId))).returning().then(([item]) => item); },
    async cancel(userId: string, id: string) { const repository = createRecurringTransactionRepository(database); const rule = await repository.findByIdForUser(id, userId); if (!rule) throw new ApplicationError("INVALID_INPUT"); await repository.cancelFutureOccurrences(userId, id); return database.update(recurringTransactions).set({ status: "CANCELLED", updatedAt: now() }).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId))).returning().then(([item]) => item); },
  };
}

import { recurringTransactions } from "@know-finanzas/db/schema";
