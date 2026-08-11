import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { debts } from "../schema";

export function createDebtRepository(database: Database) {
  return {
    create(input: { userId: string; name: string; creditor: string | null; type: "PERSONAL_LOAN" | "PURCHASE_INSTALLMENTS" | "MONEY_OWED_TO_PERSON" | "SERVICE_DEBT" | "OTHER"; currencyCode: string; originalAmount: string; startDate: string; interestType: "NO_INTEREST" | "FIXED_INSTALLMENTS" | "MANUAL_INSTALLMENTS"; interestRate: string | null; notes: string | null }) {
      return database.insert(debts).values({ ...input, status: "ACTIVE" }).returning().then(([debt]) => debt);
    },
    findByIdForUser(debtId: string, userId: string) {
      return database.select().from(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId))).limit(1).then(([debt]) => debt);
    },
    listForUser(userId: string, options: { status?: "ACTIVE" | "PAID" | "OVERDUE" | "CANCELLED" } = {}) {
      return database.select().from(debts).where(and(eq(debts.userId, userId), options.status ? eq(debts.status, options.status) : undefined));
    },
  };
}
