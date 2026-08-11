import { and, eq, asc } from "drizzle-orm";
import type { Database } from "../client";
import { recurringTransactions, scheduledTransactions } from "../schema";
export function createRecurringTransactionRepository(database: Database) {
  return {
    create(input: Record<string, unknown>) { return database.insert(recurringTransactions).values(input as never).returning().then(([rule]) => rule); },
    findByIdForUser(id: string, userId: string, forUpdate = false) { const query = database.select().from(recurringTransactions).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId))).limit(1); return (forUpdate ? query.for("update") : query).then(([rule]) => rule); },
    listForUser(userId: string) { return database.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId)).orderBy(asc(recurringTransactions.nextOccurrence)); },
    insertOccurrence(input: Record<string, unknown>) { return database.insert(scheduledTransactions).values(input as never).onConflictDoNothing({ target: [scheduledTransactions.recurringTransactionId, scheduledTransactions.scheduledDate] }).returning().then(([occurrence]) => occurrence); },
    cancelFutureOccurrences(userId: string, ruleId: string) { return database.update(scheduledTransactions).set({ status: "CANCELLED", updatedAt: new Date() }).where(and(eq(scheduledTransactions.userId, userId), eq(scheduledTransactions.recurringTransactionId, ruleId), eq(scheduledTransactions.status, "SCHEDULED"))).returning(); },
  };
}
