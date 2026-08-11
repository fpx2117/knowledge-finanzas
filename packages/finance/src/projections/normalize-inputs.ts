import { Money } from "../money/money";
import { sortAndDedupeUpcoming } from "./upcoming";
import type { UpcomingItem } from "./types";

export function normalizeProjectionInputs(input: {
  userId: string;
  timezone: string;
  horizon: { start: string; end: string };
  debtRows: Array<{ id: string; debtId: string; debtName: string; installmentNumber: number; date: string; totalAmount: string; allocatedAmount: string; currencyCode: string }>;
  scheduledRows: Array<{ id: string; date: string; type: "INCOME" | "EXPENSE"; expectedAmount: string; currencyCode: string; description: string; accountId: string; categoryId: string | null; recurringTransactionId: string | null }>;
}) {
  const events: UpcomingItem[] = [
    ...input.debtRows.map((row) => ({ sourceType: "DEBT_INSTALLMENT" as const, sourceId: row.id, direction: "OUTFLOW" as const, title: row.debtName, date: row.date, amount: row.totalAmount, remainingAmount: Money.fromString(row.totalAmount, row.currencyCode).subtract(Money.fromString(row.allocatedAmount, row.currencyCode)).toString(), currencyCode: row.currencyCode, status: "UPCOMING" as const, confidence: "COMMITTED" as const, accountId: null, categoryId: null, debtId: row.debtId, installmentNumber: row.installmentNumber, recurringTransactionId: null })),
    ...input.scheduledRows.map((row) => ({ sourceType: "SCHEDULED_TRANSACTION" as const, sourceId: row.id, direction: row.type === "INCOME" ? "INFLOW" as const : "OUTFLOW" as const, title: row.description, date: row.date, amount: row.expectedAmount, remainingAmount: null, currencyCode: row.currencyCode, status: "UPCOMING" as const, confidence: "EXPECTED" as const, accountId: row.accountId, categoryId: row.categoryId, debtId: null, installmentNumber: null, recurringTransactionId: row.recurringTransactionId })),
  ];
  return { userId: input.userId, timezone: input.timezone, horizon: input.horizon, events: sortAndDedupeUpcoming(events) };
}
