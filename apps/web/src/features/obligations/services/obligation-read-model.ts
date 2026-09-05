import {
  createSubscriptionRepository,
  createUpcomingObligationQueries,
  db,
} from "@know-finanzas/db";
import {
  buildObligationReadModel,
  rollForwardRecurringDate,
  todayInTimezone,
  type ObligationInput,
  type ObligationReadModel,
  type ObligationType,
} from "@know-finanzas/finance";

/**
 * WP-OBLIGATION-READMODEL (spec 05 §6/§10): the single source the Obligaciones
 * views and the Calendario "obligaciones" layer both consume. Unifies three real
 * sources — debt installments, detected subscriptions, scheduled movements —
 * into one deterministic per-currency shape. Pure derivation lives in
 * `@know-finanzas/finance`; this layer only fetches and maps.
 *
 * Not covered yet (documented follow-up): expanding `recurring_transactions`
 * rules that have no materialised `scheduled_transactions` row — that needs RRULE
 * projection and is deliberately out of this read model to keep it deterministic.
 */

function addDaysISO(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const DEBT_TYPE_TO_OBLIGATION: Record<string, ObligationType> = {
  PURCHASE_INSTALLMENTS: "INSTALLMENT_PLAN",
  PERSONAL_LOAN: "DEBT",
  MONEY_OWED_TO_PERSON: "DEBT",
  SERVICE_DEBT: "RECURRING_BILL",
  OTHER: "OTHER",
};

function subscriptionRollFrequency(frequency: string): "WEEKLY" | "MONTHLY" | "YEARLY" {
  if (frequency === "WEEKLY") return "WEEKLY";
  if (frequency === "YEARLY") return "YEARLY";
  return "MONTHLY";
}

export type ObligationReadModelInput = {
  userId: string;
  timezone: string;
  baseCurrency: string;
  /** 7 | 15 | 30 | 60 | 90 — spec 05 §10.2. Default 30 (§10.2 "Default V1"). */
  horizonDays?: number;
  /** How far back an unpaid overdue item still counts. Default 90. */
  overdueGraceDays?: number;
  now?: Date;
};

export function createObligationReadModel(database = db) {
  const upcoming = createUpcomingObligationQueries(database);
  const subscriptions = createSubscriptionRepository(database);

  return {
    async getObligations(input: ObligationReadModelInput): Promise<ObligationReadModel> {
      const now = input.now ?? new Date();
      const horizonDays = input.horizonDays ?? 30;
      const overdueGraceDays = input.overdueGraceDays ?? 90;
      const today = todayInTimezone(now, input.timezone);
      const rangeFrom = addDaysISO(today, -overdueGraceDays);
      const rangeTo = addDaysISO(today, horizonDays + 1);

      const [installmentRows, scheduledRows, subscriptionRows] = await Promise.all([
        upcoming.listDebtInstallmentsForUser(input.userId, { from: rangeFrom, to: rangeTo }),
        upcoming.listScheduledForUser(input.userId, { from: rangeFrom, to: rangeTo }),
        subscriptions.listForUser(input.userId, "ACTIVE"),
      ]);

      const inputs: ObligationInput[] = [];

      for (const row of installmentRows) {
        inputs.push({
          sourceType: "DEBT_INSTALLMENT",
          sourceId: row.installment.id,
          title:
            row.debt.name +
            (row.installment.installmentNumber ? ` · cuota ${row.installment.installmentNumber}` : ""),
          type: DEBT_TYPE_TO_OBLIGATION[row.debt.type] ?? "DEBT",
          amountMode: "FIXED",
          source: "MANUAL",
          confidence: "COMMITTED",
          currencyCode: row.debt.currencyCode,
          amount: row.installment.totalAmount,
          paidAmount: row.allocatedAmount,
          dueDate: row.installment.dueDate,
          debtId: row.debt.id,
          accountId: null,
          categoryId: null,
          installmentNumber: row.installment.installmentNumber ?? null,
          href: `/obligations/${row.debt.id}`,
        });
      }

      for (const row of scheduledRows) {
        if (row.type !== "EXPENSE") continue; // future income is not an obligation (§9.3)
        inputs.push({
          sourceType: "SCHEDULED_TRANSACTION",
          sourceId: row.id,
          title: row.description,
          type: row.recurringTransactionId ? "RECURRING_BILL" : "ONE_TIME",
          amountMode: "FIXED",
          source: row.recurringTransactionId ? "RECURRENCE" : "MANUAL",
          confidence: "EXPECTED",
          currencyCode: row.currencyCode,
          amount: row.expectedAmount,
          paidAmount: "0",
          dueDate: row.scheduledDate,
          debtId: null,
          accountId: row.accountId,
          categoryId: row.categoryId ?? null,
          installmentNumber: null,
          href: "/transactions/scheduled",
        });
      }

      for (const row of subscriptionRows) {
        inputs.push({
          sourceType: "SUBSCRIPTION",
          sourceId: row.id,
          title: row.label,
          type: "SUBSCRIPTION",
          amountMode: "ESTIMATED", // detected from history — next charge amount isn't confirmed (§6.3)
          source: "DETECTED",
          confidence: "EXPECTED",
          currencyCode: row.currencyCode,
          amount: row.currentAmount,
          paidAmount: "0",
          dueDate: rollForwardRecurringDate(row.nextExpectedOn, subscriptionRollFrequency(row.frequency), today),
          debtId: null,
          accountId: null,
          categoryId: row.categoryId ?? null,
          installmentNumber: null,
          href: "/obligations/subscriptions",
        });
      }

      return buildObligationReadModel(inputs, {
        today,
        horizonDays,
        baseCurrency: input.baseCurrency,
        overdueGraceDays,
      });
    },
  };
}
