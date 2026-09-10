import type { NotificationIntent } from "@know-finanzas/notifications";
import { evaluatePromotionExpiry } from "@know-finanzas/notifications";

type Intent = Omit<NotificationIntent, "userId">;
type Notify = (input: { userId: string; userTimezone: string; intent: Intent }) => Promise<unknown>;

type UpcomingObligationQueries = {
  listDebtInstallmentsForUser(
    userId: string,
    range: { from: string; to: string },
  ): Promise<Array<{ debt: { id: string; name: string }; installment: { id: string; dueDate: string } }>>;
  listScheduledForUser(
    userId: string,
    range: { from: string; to: string },
  ): Promise<Array<{ id: string; description: string | null; scheduledDate: string }>>;
};

type DebtSummaryQueries = unknown;

type PromotionQueries = {
  findActiveGrantForUser(userId: string): Promise<{ id: string; endsAt: Date } | undefined>;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 7;
const TRIAL_ENDING_THRESHOLDS = new Set([7, 3, 1]);

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The recurring sweep behind digest/reminder notifications (spec 09). Pure orchestration: it reads
 * a few finance projections, builds `NotificationIntent`s and hands each to `notify`, which owns
 * dedup (via `dedupKey`) and the premium-access gate. Safe to run on any cadence — re-evaluation
 * never duplicates a stored notification.
 */
export function createEvaluateFinancialAlerts(dependencies: {
  debts: DebtSummaryQueries;
  scheduled: UpcomingObligationQueries;
  promotions: PromotionQueries;
  notify: Notify;
}) {
  return async function evaluateFinancialAlerts(input: {
    userId: string;
    userTimezone: string;
    now: Date;
    trialEndsAt: Date | null;
  }): Promise<void> {
    const { userId, userTimezone, now } = input;
    const today = isoDate(now);
    const emit = (intent: Intent) => dependencies.notify({ userId, userTimezone, intent });

    // --- Debt installments: overdue + due within the next week ------------------------------
    const installments = await dependencies.scheduled.listDebtInstallmentsForUser(userId, {
      from: isoDate(new Date(now.getTime() - 365 * DAY_MS)),
      to: isoDate(new Date(now.getTime() + (DUE_SOON_DAYS + 1) * DAY_MS)),
    });

    for (const row of installments) {
      const overdue = row.installment.dueDate < today;
      const type = overdue ? "DEBT_OVERDUE" : "DEBT_DUE_SOON";
      await emit({
        type,
        category: "FINANCIAL",
        priority: overdue ? "HIGH" : "NORMAL",
        titleKey: type,
        bodyKey: type,
        subjectType: "DEBT",
        subjectId: row.debt.id,
        metadata: { debtName: row.debt.name, dueDate: row.installment.dueDate },
        occurredAt: now,
        dedupKey: `${type}:${row.installment.id}`,
      });
    }

    // --- Scheduled transactions due today --------------------------------------------------
    const scheduled = await dependencies.scheduled.listScheduledForUser(userId, {
      from: today,
      to: isoDate(new Date(now.getTime() + DAY_MS)),
    });
    for (const row of scheduled) {
      await emit({
        type: "SCHEDULED_TRANSACTION_DUE",
        category: "FINANCIAL",
        priority: "NORMAL",
        titleKey: "SCHEDULED_TRANSACTION_DUE",
        bodyKey: "SCHEDULED_TRANSACTION_DUE",
        subjectType: "SCHEDULED_TRANSACTION",
        subjectId: row.id,
        metadata: { description: row.description ?? "Un movimiento programado" },
        occurredAt: now,
        dedupKey: `SCHEDULED_TRANSACTION_DUE:${row.id}:${row.scheduledDate}`,
      });
    }

    // --- Promotional grant expiry reminders (category ACCOUNT, never BILLING) --------------
    const grant = await dependencies.promotions.findActiveGrantForUser(userId);
    if (grant) {
      for (const intent of evaluatePromotionExpiry({ grant: { id: grant.id, endsAt: grant.endsAt }, now })) {
        await emit(intent);
      }
    }

    // --- Trial countdown ------------------------------------------------------------------
    if (input.trialEndsAt) {
      const daysRemaining = Math.floor((input.trialEndsAt.getTime() - now.getTime()) / DAY_MS);
      if (TRIAL_ENDING_THRESHOLDS.has(daysRemaining)) {
        await emit({
          type: "TRIAL_ENDING",
          category: "ACCOUNT",
          priority: "NORMAL",
          titleKey: "TRIAL_ENDING",
          bodyKey: "TRIAL_ENDING",
          metadata: { daysRemaining },
          occurredAt: now,
          dedupKey: `TRIAL_ENDING:${userId}:${daysRemaining}`,
        });
      }
    }
  };
}

export type EvaluateFinancialAlerts = ReturnType<typeof createEvaluateFinancialAlerts>;
