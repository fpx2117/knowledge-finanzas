import { and, eq, not } from "drizzle-orm";

import { createDebtSummaryQueries, db, debts, debtInstallments } from "@know-finanzas/db";
import { deriveDebtStatus, deriveInstallmentStatus, Money } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "@/lib/billing/product-access-gate";

export type DebtType = "PERSONAL_LOAN" | "PURCHASE_INSTALLMENTS" | "MONEY_OWED_TO_PERSON" | "SERVICE_DEBT" | "OTHER";
export type InterestType = "NO_INTEREST" | "FIXED_INSTALLMENTS" | "MANUAL_INSTALLMENTS";

type DebtInput = {
  name: string;
  creditor?: string;
  type: DebtType;
  currencyCode: string;
  originalAmount: string;
  startDate: string;
  interestType: InterestType;
  interestRate?: string;
  notes?: string;
  installments: Array<{
    installmentNumber: number;
    dueDate: string;
    principalAmount: string;
    interestAmount: string;
    feeAmount: string;
    totalAmount: string;
  }>;
};

type DebtSummaryRow = {
  debt: {
    id: string;
    name: string;
    creditor: string | null;
    type: string;
    currencyCode: string;
    originalAmount: string;
    startDate: string;
    status: "ACTIVE" | "PAID" | "OVERDUE" | "CANCELLED";
    cancelledAt: Date | null;
  };
  installment: {
    id: string;
    debtId: string;
    installmentNumber: number;
    dueDate: string;
    principalAmount: string;
    interestAmount: string;
    feeAmount: string;
    totalAmount: string;
    status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  };
  allocatedAmount: string;
};

function buildDebtDetail(rows: DebtSummaryRow[], timezone: string, now: Date) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const debt = rows[0].debt;
  const installments = rows
    .map((row) => {
      const total = Money.fromString(row.installment.totalAmount, debt.currencyCode);
      const allocated = Money.fromString(row.allocatedAmount, debt.currencyCode);
      const derived = deriveInstallmentStatus({
        totalAmount: total,
        allocatedAmount: allocated,
        dueDate: row.installment.dueDate,
        cancelled: row.installment.status === "CANCELLED",
        today,
      });
      return {
        ...row.installment,
        paidAmount: derived.paidAmount.toString(),
        remainingAmount: derived.remainingAmount.toString(),
        effectiveStatus: derived.status,
      };
    })
    .sort((a, b) => a.installmentNumber - b.installmentNumber);

  const status = deriveDebtStatus({
    cancelled: debt.status === "CANCELLED",
    currency: debt.currencyCode,
    installments: installments.map((item) => ({
      status: item.effectiveStatus,
      remainingAmount: Money.fromString(item.remainingAmount, debt.currencyCode),
    })),
  });

  return {
    ...debt,
    totalPayable: installments
      .reduce((sum, item) => sum.add(Money.fromString(item.totalAmount, debt.currencyCode)), Money.zero(debt.currencyCode))
      .toString(),
    paidAmount: installments
      .reduce((sum, item) => sum.add(Money.fromString(item.paidAmount, debt.currencyCode)), Money.zero(debt.currencyCode))
      .toString(),
    remainingAmount: status.remainingAmount.toString(),
    effectiveStatus: status.status,
    installments,
  };
}

export type DebtDetail = ReturnType<typeof buildDebtDetail>;

export function createDebtService(database = db, gate: ProductAccessGate = allowAllProductAccessGate) {
  const queries = createDebtSummaryQueries(database);
  return {
    async createDebt(userId: string, input: DebtInput) {
      await gate.assertCanWrite(userId);
      if (input.installments.length === 0) throw new ApplicationError("INVALID_INPUT", { field: "installments" });
      const sum = input.installments.reduce(
        (value, item) => value.add(Money.fromPositiveString(item.totalAmount, input.currencyCode)),
        Money.zero(input.currencyCode),
      );
      const debt = await database.transaction(async (tx) => {
        const [created] = await tx
          .insert(debts)
          .values({
            userId,
            name: input.name.trim(),
            creditor: input.creditor?.trim() || null,
            type: input.type,
            currencyCode: input.currencyCode,
            originalAmount: input.originalAmount,
            startDate: input.startDate,
            interestType: input.interestType,
            interestRate: input.interestRate ?? null,
            notes: input.notes?.trim() || null,
            status: "ACTIVE",
          })
          .returning();
        const installments = await tx
          .insert(debtInstallments)
          .values(input.installments.map((item) => ({ ...item, debtId: created.id, status: "PENDING" as const })))
          .returning();
        if (installments.length !== input.installments.length) throw new Error("Debt installment persistence failed");
        return created;
      });
      return { debt, totalPayable: sum.toString() };
    },

    async getDebtDetail(user: { id: string; timezone: string }, debtId: string, now = new Date()) {
      const rows = await queries.listDebtInputsForUser(user.id);
      const own = rows.filter((row) => row.debt.id === debtId);
      if (own.length === 0) throw new ApplicationError("INVALID_INPUT", { field: "debtId" });
      return buildDebtDetail(own, user.timezone, now);
    },

    async listDebts(user: { id: string; timezone: string }, now = new Date()) {
      const rows = await queries.listDebtInputsForUser(user.id);
      return [...new Set(rows.map((row) => row.debt.id))].map((id) =>
        buildDebtDetail(
          rows.filter((row) => row.debt.id === id),
          user.timezone,
          now,
        ),
      );
    },

    async cancelDebt(userId: string, debtId: string, cancelledAt = new Date()) {
      return database.transaction(async (tx) => {
        const [debt] = await tx.select().from(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId))).for("update");
        if (!debt) throw new ApplicationError("INVALID_INPUT", { field: "debtId" });
        if (debt.status === "CANCELLED") throw new ApplicationError("INVALID_INPUT", { field: "debtId" });
        await tx.update(debts).set({ status: "CANCELLED", cancelledAt, updatedAt: cancelledAt }).where(eq(debts.id, debtId));
        await tx
          .update(debtInstallments)
          .set({ status: "CANCELLED", cancelledAt, updatedAt: cancelledAt })
          .where(and(eq(debtInstallments.debtId, debtId), not(eq(debtInstallments.status, "PAID"))));
        return debtId;
      });
    },
  };
}
