import { todayInTimezone } from "@know-finanzas/finance";
import { evaluatePromotionExpiry, type NotificationIntent } from "@know-finanzas/notifications";

type DebtInputRow = { debt: { id: string; name: string; currencyCode: string; status: string }; installment: { id: string; dueDate: string; status: string } };
type ScheduledRow = { id: string; scheduledDate: string; description: string; expectedAmount: string; currencyCode: string };

export type NotifyFn = (input: { userId: string; userTimezone: string; intent: Omit<NotificationIntent, "userId"> }) => Promise<unknown>;

export type EvaluateFinancialAlertsDependencies = {
  debts: { listDebtInputsForUser(userId: string): Promise<DebtInputRow[]> };
  scheduled: { listScheduledForUser(userId: string, range: { from: string; to: string }): Promise<ScheduledRow[]> };
  // A user has at most one ACTIVE promotional grant (partial unique index in packages/db), so a
  // single lookup is enough — no "list grants ending soon" query needed.
  promotions: { findActiveGrantForUser(userId: string): Promise<{ id: string; endsAt: Date } | undefined> };
  notify: NotifyFn;
};

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const TRIAL_ENDING_THRESHOLDS = new Set([7, 3, 1]);

// MVP "scheduling" substitute (docs/09-notifications-alerts.md, TASK-049 narrowed scope — no
// worker/cron infra exists yet): evaluated on each dashboard visit rather than on a timer, the
// same pattern already established for budget alerts in TASK-030/031. Every notification here is
// idempotent via its dedup key, so revisiting the dashboard many times a day never spams.
// `notify` is injected (rather than importing notifyUser directly) so this stays unit-testable
// without a real database or product-access gate.
export function createEvaluateFinancialAlerts(dependencies: EvaluateFinancialAlertsDependencies) {
  return async function evaluateFinancialAlerts(input: { userId: string; userTimezone: string; now: Date; trialEndsAt: Date | null }) {
    const today = todayInTimezone(input.now, input.userTimezone);
    const tomorrow = addDays(today, 1);

    const [debtRows, scheduledRows] = await Promise.all([
      dependencies.debts.listDebtInputsForUser(input.userId),
      dependencies.scheduled.listScheduledForUser(input.userId, { from: today, to: addDays(today, 1) }),
    ]);

    const notifications: Array<Promise<unknown>> = [];

    for (const row of debtRows) {
      if (row.installment.status === "PAID" || row.installment.status === "CANCELLED" || row.debt.status === "CANCELLED") continue;
      const dueDate = row.installment.dueDate;
      if (dueDate === tomorrow) {
        notifications.push(dependencies.notify({
          userId: input.userId,
          userTimezone: input.userTimezone,
          intent: { type: "DEBT_DUE_SOON", category: "FINANCIAL", priority: "NORMAL", titleKey: "DEBT_DUE_SOON", bodyKey: "DEBT_DUE_SOON", subjectType: "DEBT", subjectId: row.debt.id, metadata: { debtName: row.debt.name, dueDate }, occurredAt: input.now, dedupKey: `DEBT_DUE_SOON:${row.installment.id}` },
        }));
      } else if (dueDate < today) {
        notifications.push(dependencies.notify({
          userId: input.userId,
          userTimezone: input.userTimezone,
          intent: { type: "DEBT_OVERDUE", category: "FINANCIAL", priority: "HIGH", titleKey: "DEBT_OVERDUE", bodyKey: "DEBT_OVERDUE", subjectType: "DEBT", subjectId: row.debt.id, metadata: { debtName: row.debt.name, dueDate }, occurredAt: input.now, dedupKey: `DEBT_OVERDUE:${row.installment.id}` },
        }));
      }
    }

    for (const item of scheduledRows) {
      notifications.push(dependencies.notify({
        userId: input.userId,
        userTimezone: input.userTimezone,
        intent: { type: "SCHEDULED_TRANSACTION_DUE", category: "FINANCIAL", priority: "NORMAL", titleKey: "SCHEDULED_TRANSACTION_DUE", bodyKey: "SCHEDULED_TRANSACTION_DUE", subjectType: "SCHEDULED_TRANSACTION", subjectId: item.id, metadata: { description: item.description, scheduledDate: item.scheduledDate }, occurredAt: input.now, dedupKey: `SCHEDULED_TRANSACTION_DUE:${item.id}` },
      }));
    }

    const activeGrant = await dependencies.promotions.findActiveGrantForUser(input.userId);
    if (activeGrant) {
      for (const intent of evaluatePromotionExpiry({ grant: activeGrant, now: input.now })) {
        notifications.push(dependencies.notify({ userId: input.userId, userTimezone: input.userTimezone, intent }));
      }
    }

    if (input.trialEndsAt) {
      const daysRemaining = Math.floor((input.trialEndsAt.getTime() - input.now.getTime()) / (24 * 60 * 60 * 1000));
      if (TRIAL_ENDING_THRESHOLDS.has(daysRemaining)) {
        notifications.push(dependencies.notify({
          userId: input.userId,
          userTimezone: input.userTimezone,
          intent: { type: "TRIAL_ENDING", category: "ACCOUNT", priority: "NORMAL", titleKey: "TRIAL_ENDING", bodyKey: "TRIAL_ENDING", occurredAt: input.now, metadata: { daysRemaining }, dedupKey: `TRIAL_ENDING:${input.userId}:${daysRemaining}` },
        }));
      } else if (daysRemaining <= 0) {
        notifications.push(dependencies.notify({
          userId: input.userId,
          userTimezone: input.userTimezone,
          intent: { type: "TRIAL_EXPIRED", category: "ACCOUNT", priority: "NORMAL", titleKey: "TRIAL_EXPIRED", bodyKey: "TRIAL_EXPIRED", occurredAt: input.now, dedupKey: `TRIAL_EXPIRED:${input.userId}` },
        }));
      }
    }

    await Promise.all(notifications);
  };
}
