import { describe, expect, it } from "vitest";
import { createDashboardService } from "../../apps/web/src/features/dashboard/services/dashboard-service";

describe("dashboard service", () => {
  it("composes bounded read models with exact balances", async () => {
    const calls = { balances: 0, monthly: 0, activity: 0 };
    const service = createDashboardService({
      balances: { getAccountBalancesForUser: async () => { calls.balances += 1; return [{ account: { id: "a", name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "1000", status: "ACTIVE" }, incomeTotal: "500", expenseTotal: "200" }]; } },
      monthly: { getMonthlyIncomeExpense: async () => { calls.monthly += 1; return [{ currencyCode: "ARS", incomeTotal: "500", expenseTotal: "200" }]; } },
      activity: { listRecentActivity: async () => { calls.activity += 1; return []; } },
      debts: { listDebtInputsForUser: async () => [] },
      scheduled: { listScheduledForUser: async () => [] },
    });

    const summary = await service.getDashboardSummary({ userId: "user-a", timezone: "UTC", now: new Date("2026-01-15T12:00:00Z") });
    expect(summary.liquidBalances).toEqual([{ currencyCode: "ARS", total: "1300.00" }]);
    expect(summary.monthly[0]).toMatchObject({ currencyCode: "ARS", income: "500.00", expense: "200.00" });
    expect(calls).toEqual({ balances: 1, monthly: 1, activity: 1 });
  });

  it("reflects refunds, adjustments and liability payments in account balances", async () => {
    const service = createDashboardService({
      balances: { getAccountBalancesForUser: async () => [{ account: { id: "a", name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "1000", status: "ACTIVE" }, incomeTotal: "0", expenseTotal: "0", refundTotal: "50", adjustmentInTotal: "20", adjustmentOutTotal: "5", liabilityPaymentTotal: "40" }] },
      monthly: { getMonthlyIncomeExpense: async () => [] },
      activity: { listRecentActivity: async () => [] },
      debts: { listDebtInputsForUser: async () => [] },
      scheduled: { listScheduledForUser: async () => [] },
    });

    const summary = await service.getDashboardSummary({ userId: "user-a", timezone: "UTC", now: new Date("2026-01-15T12:00:00Z") });
    expect(summary.liquidBalances).toEqual([{ currencyCode: "ARS", total: "1025.00" }]);
  });

  it("exposes debt, spendable and projected cashflow without mixing currencies", async () => {
    const service = createDashboardService({
      balances: { getAccountBalancesForUser: async () => [{ account: { id: "a", name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "1000", status: "ACTIVE" }, incomeTotal: "0", expenseTotal: "0" }, { account: { id: "u", name: "Dólares", type: "BANK", currencyCode: "USD", openingBalance: "50", status: "ACTIVE" }, incomeTotal: "0", expenseTotal: "0" }] },
      monthly: { getMonthlyIncomeExpense: async () => [] },
      activity: { listRecentActivity: async () => [] },
      debts: { listDebtInputsForUser: async () => [{ debt: { id: "d", name: "Cuota", currencyCode: "ARS", status: "ACTIVE" }, installment: { id: "i", dueDate: "2026-01-20", installmentNumber: 1, totalAmount: "300", status: "PENDING" }, allocatedAmount: "100" }] },
      scheduled: { listScheduledForUser: async () => [{ id: "s", scheduledDate: "2026-01-22", type: "INCOME", expectedAmount: "200", currencyCode: "ARS", description: "Cobro" }] },
    });

    const summary = await service.getDashboardSummary({ userId: "user-a", timezone: "UTC", now: new Date("2026-01-15T12:00:00Z") });
    expect(summary.debt).toEqual([{ currencyCode: "ARS", remaining: "200.00" }]);
    expect(summary.projections.map((item) => item.currencyCode)).toEqual(["ARS", "USD"]);
    expect(summary.projections[0]?.spendable.spendable.toString()).toBe("800.00");
    expect(summary.projections[0]?.cashflow.projectedEndBalance.toString()).toBe("1000.00");
  });
});
