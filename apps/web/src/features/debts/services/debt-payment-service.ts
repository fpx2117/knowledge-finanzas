import { randomUUID } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import {
  accounts,
  db,
  debts,
  debtInstallments,
  debtPaymentAllocations,
  debtPayments,
  transactions,
  type Database,
} from "@know-finanzas/db";
import { allocatePayment, deriveDebtStatus, deriveInstallmentStatus, Money } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "@/lib/billing/product-access-gate";

export function createDebtPaymentService(
  database: Database = db,
  now = () => new Date(),
  gate: ProductAccessGate = allowAllProductAccessGate,
) {
  return {
    async recordDebtPayment(
      user: { id: string; timezone: string },
      input: { debtId: string; accountId: string; amount: string; paidAt?: string; notes?: string },
    ) {
      await gate.assertCanWrite(user.id);
      return database.transaction(async (tx) => {
        const [account] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, user.id)))
          .for("update");
        if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND");
        if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED");

        const [debt] = await tx
          .select()
          .from(debts)
          .where(and(eq(debts.id, input.debtId), eq(debts.userId, user.id)))
          .for("update");
        if (!debt) throw new ApplicationError("INVALID_INPUT", { field: "debtId" });
        if (debt.status === "CANCELLED") throw new ApplicationError("INVALID_INPUT", { field: "debtId" });
        if (debt.currencyCode !== account.currencyCode) throw new ApplicationError("CURRENCY_MISMATCH");

        const installments = await tx
          .select()
          .from(debtInstallments)
          .where(eq(debtInstallments.debtId, debt.id))
          .orderBy(debtInstallments.dueDate, debtInstallments.installmentNumber)
          .for("update");

        const snapshots = await Promise.all(
          installments.map(async (installment) => {
            const [allocated] = await tx
              .select({ total: sql<string>`coalesce(sum(${debtPaymentAllocations.amount}), 0)` })
              .from(debtPaymentAllocations)
              .innerJoin(
                debtPayments,
                and(eq(debtPayments.id, debtPaymentAllocations.paymentId), eq(debtPayments.status, "POSTED")),
              )
              .where(eq(debtPaymentAllocations.installmentId, installment.id));
            return {
              id: installment.id,
              installmentNumber: installment.installmentNumber,
              dueDate: installment.dueDate,
              totalAmount: Money.fromString(installment.totalAmount, debt.currencyCode),
              allocatedAmount: Money.fromString(allocated?.total ?? "0", debt.currencyCode),
              status: installment.status,
            };
          }),
        );

        let allocationPreview;
        try {
          allocationPreview = allocatePayment({
            amount: Money.fromPositiveString(input.amount, debt.currencyCode),
            installments: snapshots,
            strategy: "OLDEST_DUE_FIRST",
          });
        } catch (error) {
          throw new ApplicationError("INVALID_INPUT", { cause: error });
        }

        const paidAt = input.paidAt ? new Date(input.paidAt) : now();
        const transactionId = randomUUID();
        const [paymentTransaction] = await tx
          .insert(transactions)
          .values({
            id: transactionId,
            userId: user.id,
            accountId: account.id,
            type: "LIABILITY_PAYMENT",
            status: "POSTED",
            amount: allocationPreview.paymentAmount.toString(),
            currencyCode: debt.currencyCode,
            description: `Pago de ${debt.name}`,
            categoryId: null,
            occurredAt: paidAt,
            postedAt: paidAt,
            source: "DEBT_PAYMENT",
            merchant: null,
            notes: input.notes?.trim() || null,
          })
          .returning();

        const paymentId = randomUUID();
        await tx.insert(debtPayments).values({
          id: paymentId,
          userId: user.id,
          debtId: debt.id,
          accountId: account.id,
          amount: allocationPreview.paymentAmount.toString(),
          currencyCode: debt.currencyCode,
          paidAt,
          transactionId: paymentTransaction.id,
          status: "POSTED",
          notes: input.notes?.trim() || null,
        });
        await tx.insert(debtPaymentAllocations).values(
          allocationPreview.allocations.map((item) => ({
            paymentId,
            installmentId: item.installmentId,
            amount: item.amount.toString(),
          })),
        );

        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: user.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now());
        const derivedInstallments = snapshots.map((snapshot) => {
          const allocation = allocationPreview.allocations.find((item) => item.installmentId === snapshot.id);
          const allocated = snapshot.allocatedAmount.add(allocation?.amount ?? Money.zero(debt.currencyCode));
          return {
            id: snapshot.id,
            derived: deriveInstallmentStatus({
              totalAmount: snapshot.totalAmount,
              allocatedAmount: allocated,
              dueDate: snapshot.dueDate,
              cancelled: snapshot.status === "CANCELLED",
              today,
            }),
          };
        });
        for (const item of derivedInstallments) {
          await tx.update(debtInstallments).set({ status: item.derived.status, updatedAt: now() }).where(eq(debtInstallments.id, item.id));
        }
        const debtStatus = deriveDebtStatus({
          cancelled: false,
          currency: debt.currencyCode,
          installments: derivedInstallments.map((item) => ({
            status: item.derived.status,
            remainingAmount: item.derived.remainingAmount,
          })),
        });
        await tx.update(debts).set({ status: debtStatus.status, updatedAt: now() }).where(eq(debts.id, debt.id));

        return { debtRemaining: debtStatus.remainingAmount.toString(), debtStatus: debtStatus.status };
      });
    },
  };
}
