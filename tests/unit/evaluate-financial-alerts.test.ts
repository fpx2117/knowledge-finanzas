import { describe, expect, it, vi } from "vitest";
import { createEvaluateFinancialAlerts } from "../../apps/web/src/features/notifications/services/evaluate-financial-alerts";

const userId = "user-1";
const userTimezone = "UTC";

function fakeDebts(rows: Array<{ debtId: string; installmentId: string; dueDate: string; status?: string; debtStatus?: string }>) {
  return {
    listDebtInputsForUser: async () => rows.map((row) => ({
      debt: { id: row.debtId, name: "Deuda", currencyCode: "ARS", status: row.debtStatus ?? "ACTIVE" },
      installment: { id: row.installmentId, dueDate: row.dueDate, status: row.status ?? "PENDING" },
    })),
  };
}

function fakeScheduled(rows: Array<{ id: string; scheduledDate: string }> = []) {
  return { listScheduledForUser: async () => rows.map((row) => ({ id: row.id, scheduledDate: row.scheduledDate, description: "Gasto programado", expectedAmount: "100", currencyCode: "ARS" })) };
}

function fakePromotions(grant: { id: string; endsAt: Date } | undefined = undefined) {
  return { findActiveGrantForUser: async () => grant };
}

describe("evaluateFinancialAlerts", () => {
  it("notifies DEBT_DUE_SOON for an installment due tomorrow", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([{ debtId: "d1", installmentId: "i1", dueDate: "2026-01-16" }]), scheduled: fakeScheduled(), promotions: fakePromotions(), notify });

    await evaluate({ userId, userTimezone, now: new Date("2026-01-15T12:00:00Z"), trialEndsAt: null });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: expect.objectContaining({ type: "DEBT_DUE_SOON", dedupKey: "DEBT_DUE_SOON:i1" }) }));
  });

  it("notifies DEBT_OVERDUE for an installment past due, not DEBT_DUE_SOON", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([{ debtId: "d1", installmentId: "i1", dueDate: "2026-01-10" }]), scheduled: fakeScheduled(), promotions: fakePromotions(), notify });

    await evaluate({ userId, userTimezone, now: new Date("2026-01-15T12:00:00Z"), trialEndsAt: null });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: expect.objectContaining({ type: "DEBT_OVERDUE", priority: "HIGH", dedupKey: "DEBT_OVERDUE:i1" }) }));
  });

  it("does not notify for an installment due today or further in the future", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([{ debtId: "d1", installmentId: "i1", dueDate: "2026-01-15" }, { debtId: "d2", installmentId: "i2", dueDate: "2026-02-01" }]), scheduled: fakeScheduled(), promotions: fakePromotions(), notify });

    await evaluate({ userId, userTimezone, now: new Date("2026-01-15T12:00:00Z"), trialEndsAt: null });

    expect(notify).not.toHaveBeenCalled();
  });

  it("skips PAID, CANCELLED installments and CANCELLED debts", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({
      debts: fakeDebts([
        { debtId: "d1", installmentId: "i1", dueDate: "2026-01-10", status: "PAID" },
        { debtId: "d2", installmentId: "i2", dueDate: "2026-01-10", status: "CANCELLED" },
        { debtId: "d3", installmentId: "i3", dueDate: "2026-01-10", debtStatus: "CANCELLED" },
      ]),
      scheduled: fakeScheduled(), promotions: fakePromotions(),
      notify,
    });

    await evaluate({ userId, userTimezone, now: new Date("2026-01-15T12:00:00Z"), trialEndsAt: null });

    expect(notify).not.toHaveBeenCalled();
  });

  it("notifies SCHEDULED_TRANSACTION_DUE for items due today", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([]), scheduled: fakeScheduled([{ id: "s1", scheduledDate: "2026-01-15" }]), promotions: fakePromotions(), notify });

    await evaluate({ userId, userTimezone, now: new Date("2026-01-15T12:00:00Z"), trialEndsAt: null });

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: expect.objectContaining({ type: "SCHEDULED_TRANSACTION_DUE", dedupKey: "SCHEDULED_TRANSACTION_DUE:s1" }) }));
  });

  it("notifies TRIAL_ENDING only at the 7/3/1 day thresholds", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([]), scheduled: fakeScheduled(), promotions: fakePromotions(), notify });
    const now = new Date("2026-01-01T00:00:00Z");

    await evaluate({ userId, userTimezone, now, trialEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) });
    await evaluate({ userId, userTimezone, now, trialEndsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) });
    await evaluate({ userId, userTimezone, now, trialEndsAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) });

    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenNthCalledWith(1, expect.objectContaining({ intent: expect.objectContaining({ type: "TRIAL_ENDING", category: "ACCOUNT", dedupKey: `TRIAL_ENDING:${userId}:7` }) }));
    expect(notify).toHaveBeenNthCalledWith(2, expect.objectContaining({ intent: expect.objectContaining({ type: "TRIAL_ENDING", dedupKey: `TRIAL_ENDING:${userId}:1` }) }));
  });

  it("notifies TRIAL_EXPIRED once the trial end date has passed", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([]), scheduled: fakeScheduled(), promotions: fakePromotions(), notify });
    const now = new Date("2026-01-10T00:00:00Z");

    await evaluate({ userId, userTimezone, now, trialEndsAt: new Date("2026-01-01T00:00:00Z") });

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: expect.objectContaining({ type: "TRIAL_EXPIRED", category: "ACCOUNT", dedupKey: `TRIAL_EXPIRED:${userId}` }) }));
  });

  it("does not evaluate trial rules when trialEndsAt is null", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([]), scheduled: fakeScheduled(), promotions: fakePromotions(), notify });

    await evaluate({ userId, userTimezone, now: new Date("2026-01-15T12:00:00Z"), trialEndsAt: null });

    expect(notify).not.toHaveBeenCalled();
  });

  it("notifies PROMOTION_ENDING at the 7-day threshold for an active promotional grant", async () => {
    const notify = vi.fn();
    const now = new Date("2026-01-01T00:00:00Z");
    const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([]), scheduled: fakeScheduled(), promotions: fakePromotions({ id: "grant-1", endsAt }), notify });

    await evaluate({ userId, userTimezone, now, trialEndsAt: null });

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: expect.objectContaining({ type: "PROMOTION_ENDING", category: "ACCOUNT", dedupKey: "PROMOTION_ENDING:grant-1:7" }) }));
  });

  it("notifies PROMOTION_EXPIRED once the grant's endsAt has passed, distinct from any billing event", async () => {
    const notify = vi.fn();
    const now = new Date("2026-01-10T00:00:00Z");
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([]), scheduled: fakeScheduled(), promotions: fakePromotions({ id: "grant-1", endsAt: new Date("2026-01-01T00:00:00Z") }), notify });

    await evaluate({ userId, userTimezone, now, trialEndsAt: null });

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: expect.objectContaining({ type: "PROMOTION_EXPIRED", category: "ACCOUNT", dedupKey: "PROMOTION_EXPIRED:grant-1" }) }));
    expect(notify).not.toHaveBeenCalledWith(expect.objectContaining({ intent: expect.objectContaining({ type: expect.stringMatching(/SUBSCRIPTION/) }) }));
  });

  it("does not notify anything promotion-related when the user has no active grant", async () => {
    const notify = vi.fn();
    const evaluate = createEvaluateFinancialAlerts({ debts: fakeDebts([]), scheduled: fakeScheduled(), promotions: fakePromotions(undefined), notify });

    await evaluate({ userId, userTimezone, now: new Date("2026-01-15T12:00:00Z"), trialEndsAt: null });

    expect(notify).not.toHaveBeenCalled();
  });
});
