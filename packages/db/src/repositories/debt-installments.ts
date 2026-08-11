import { and, asc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { debtInstallments, debts } from "../schema";

export function createDebtInstallmentRepository(database: Database) {
  return {
    async createForDebtForUser(input: { debtId: string; userId: string; installmentNumber: number; dueDate: string; principalAmount: string; interestAmount: string; feeAmount: string; totalAmount: string }) {
      const [ownedDebt] = await database.select({ id: debts.id }).from(debts).where(and(eq(debts.id, input.debtId), eq(debts.userId, input.userId))).limit(1);
      if (!ownedDebt) return undefined;
      return database.insert(debtInstallments).values({ ...input, status: "PENDING" }).returning().then(([installment]) => installment);
    },
    createManyForDebtForUser(userId: string, debtId: string, values: Array<{ installmentNumber: number; dueDate: string; principalAmount: string; interestAmount: string; feeAmount: string; totalAmount: string }>) {
      return database.select({ id: debts.id }).from(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId))).limit(1).then(async ([ownedDebt]) => ownedDebt ? database.insert(debtInstallments).values(values.map((value) => ({ ...value, debtId, status: "PENDING" as const }))).returning() : undefined);
    },
    findByIdForUser(installmentId: string, userId: string) {
      return database.select({ installment: debtInstallments }).from(debtInstallments).innerJoin(debts, eq(debts.id, debtInstallments.debtId)).where(and(eq(debtInstallments.id, installmentId), eq(debts.userId, userId))).limit(1).then(([row]) => row?.installment);
    },
    listForDebtForUser(debtId: string, userId: string) {
      return database.select({ installment: debtInstallments }).from(debtInstallments).innerJoin(debts, eq(debts.id, debtInstallments.debtId)).where(and(eq(debtInstallments.debtId, debtId), eq(debts.userId, userId))).orderBy(asc(debtInstallments.installmentNumber)).then((rows) => rows.map((row) => row.installment));
    },
  };
}
