import { describe, expect, it, vi } from "vitest";
import { createEvaluateFinancialAlerts } from "../../apps/web/src/features/notifications/services/evaluate-financial-alerts";

function deps(overrides: Partial<Parameters<typeof createEvaluateFinancialAlerts>[0]> = {}) {
  const notify = vi.fn().mockResolvedValue({ created: true });
  return {
    notify,
    factory: createEvaluateFinancialAlerts({
      debts: {},
      scheduled: {
        listDebtInstallmentsForUser: async () => [],
        listScheduledForUser: async () => [],
      },
      promotions: { findActiveGrantForUser: async () => undefined },
      notify,
      ...overrides,
    }),
  };
}

const now = new Date("2026-01-15T12:00:00Z");

describe("evaluateFinancialAlerts", () => {
  it("emits DEBT_OVERDUE for past-due installments and DEBT_DUE_SOON for upcoming ones", async () => {
    const { notify, factory } = deps({
      scheduled: {
        listScheduledForUser: async () => [],
        listDebtInstallmentsForUser: async () => [
          { debt: { id: "d1", name: "Préstamo" }, installment: { id: "i-late", dueDate: "2026-01-10" } },
          { debt: { id: "d1", name: "Préstamo" }, installment: { id: "i-soon", dueDate: "2026-01-16" } },
        ],
      },
    });

    await factory({ userId: "u1", userTimezone: "UTC", now, trialEndsAt: null });

    const types = notify.mock.calls.map((c) => c[0].intent.type);
    expect(types).toEqual(["DEBT_OVERDUE", "DEBT_DUE_SOON"]);
    expect(notify.mock.calls[0][0].intent.dedupKey).toBe("DEBT_OVERDUE:i-late");
    expect(notify.mock.calls[1][0].intent.dedupKey).toBe("DEBT_DUE_SOON:i-soon");
  });

  it("emits a PROMOTION_ENDING reminder when an active grant ends in exactly 7 days, category ACCOUNT", async () => {
    const { notify, factory } = deps({
      promotions: { findActiveGrantForUser: async () => ({ id: "g1", endsAt: new Date("2026-01-22T12:00:00Z") }) },
    });

    await factory({ userId: "u1", userTimezone: "UTC", now, trialEndsAt: null });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0].intent).toMatchObject({ type: "PROMOTION_ENDING", category: "ACCOUNT" });
  });

  it("emits TRIAL_ENDING at the 3-day threshold and nothing otherwise", async () => {
    const { notify, factory } = deps();

    await factory({ userId: "u1", userTimezone: "UTC", now, trialEndsAt: new Date("2026-01-18T18:00:00Z") });
    expect(notify.mock.calls.map((c) => c[0].intent.type)).toEqual(["TRIAL_ENDING"]);

    notify.mockClear();
    await factory({ userId: "u1", userTimezone: "UTC", now, trialEndsAt: new Date("2026-01-25T18:00:00Z") });
    expect(notify).not.toHaveBeenCalled();
  });
});
