import { and, eq, asc } from "drizzle-orm";
import type { Database } from "../client";
import { scheduledTransactions } from "../schema";

export function createScheduledTransactionRepository(database: Database) {
  return {
    create(input: { userId: string; accountId: string; type: "INCOME" | "EXPENSE"; expectedAmount: string; currencyCode: string; description: string; categoryId: string | null; scheduledDate: string; notes: string | null }) { return database.insert(scheduledTransactions).values({ ...input, source: "MANUAL", status: "SCHEDULED" }).returning().then(([item]) => item); },
    findByIdForUser(id: string, userId: string, forUpdate = false) { const query = database.select().from(scheduledTransactions).where(and(eq(scheduledTransactions.id, id), eq(scheduledTransactions.userId, userId))).limit(1); return (forUpdate ? query.for("update") : query).then(([item]) => item); },
    listForUser(userId: string, options: { includeTerminal?: boolean } = {}) { return database.select().from(scheduledTransactions).where(and(eq(scheduledTransactions.userId, userId), options.includeTerminal ? undefined : eq(scheduledTransactions.status, "SCHEDULED"))).orderBy(asc(scheduledTransactions.scheduledDate)); },
    updateForUser(id: string, userId: string, input: { accountId: string; type: "INCOME" | "EXPENSE"; expectedAmount: string; currencyCode: string; description: string; categoryId: string | null; scheduledDate: string; notes: string | null }) { return database.update(scheduledTransactions).set({ ...input, updatedAt: new Date() }).where(and(eq(scheduledTransactions.id, id), eq(scheduledTransactions.userId, userId), eq(scheduledTransactions.status, "SCHEDULED"))).returning().then(([item]) => item); },
    transitionForUser(id: string, userId: string, status: "SKIPPED" | "CANCELLED", updatedAt: Date) { return database.update(scheduledTransactions).set({ status, updatedAt }).where(and(eq(scheduledTransactions.id, id), eq(scheduledTransactions.userId, userId), eq(scheduledTransactions.status, "SCHEDULED"))).returning().then(([item]) => item); },
  };
}
