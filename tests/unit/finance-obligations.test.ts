import { describe, expect, it } from "vitest";
import {
  buildObligationReadModel,
  deriveObligationStatus,
  Money,
  rollForwardRecurringDate,
  type ObligationInput,
} from "@know-finanzas/finance";

const base: Omit<ObligationInput, "sourceId" | "dueDate" | "amount"> = {
  sourceType: "DEBT_INSTALLMENT",
  title: "Test",
  type: "DEBT",
  amountMode: "FIXED",
  source: "MANUAL",
  confidence: "COMMITTED",
  currencyCode: "ARS",
  paidAmount: "0",
  debtId: null,
  accountId: null,
  categoryId: null,
  installmentNumber: null,
  href: null,
};

const item = (over: Partial<ObligationInput> & Pick<ObligationInput, "sourceId" | "dueDate" | "amount">): ObligationInput => ({
  ...base,
  ...over,
});

describe("obligation read model", () => {
  const TODAY = "2026-09-05";

  it("derives presentation status from the due date and payments", () => {
    const money = (v: string) => Money.fromString(v, "ARS");
    expect(deriveObligationStatus({ dueDate: "2026-09-05", today: TODAY, remaining: money("100"), paid: money("0") })).toBe("DUE_TODAY");
    expect(deriveObligationStatus({ dueDate: "2026-09-09", today: TODAY, remaining: money("100"), paid: money("0") })).toBe("DUE_SOON");
    expect(deriveObligationStatus({ dueDate: "2026-09-30", today: TODAY, remaining: money("100"), paid: money("0") })).toBe("UPCOMING");
    expect(deriveObligationStatus({ dueDate: "2026-09-01", today: TODAY, remaining: money("100"), paid: money("0") })).toBe("OVERDUE");
    expect(deriveObligationStatus({ dueDate: "2026-09-30", today: TODAY, remaining: money("40"), paid: money("60") })).toBe("PARTIALLY_PAID");
    expect(deriveObligationStatus({ dueDate: "2026-09-01", today: TODAY, remaining: money("40"), paid: money("60") })).toBe("PARTIALLY_PAID");
  });

  it("never sums confirmed and estimated amounts into one number (§10.3)", () => {
    const model = buildObligationReadModel(
      [
        item({ sourceId: "a", dueDate: "2026-09-10", amount: "450000", amountMode: "FIXED" }),
        item({ sourceId: "b", dueDate: "2026-09-12", amount: "38000", amountMode: "ESTIMATED", sourceType: "SUBSCRIPTION" }),
      ],
      { today: TODAY, horizonDays: 30, baseCurrency: "ARS" },
    );
    const ars = model.totals.find((t) => t.currencyCode === "ARS")!;
    expect(ars.confirmed).toBe("450000.00");
    expect(ars.estimated).toBe("38000.00");
    expect(ars.count).toBe(2);
    expect(model.estimatedCount).toBe(1);
  });

  it("keeps currencies separate and reports the excluded ones (§22)", () => {
    const model = buildObligationReadModel(
      [
        item({ sourceId: "a", dueDate: "2026-09-10", amount: "450000", currencyCode: "ARS" }),
        item({ sourceId: "b", dueDate: "2026-09-11", amount: "40", currencyCode: "USD" }),
      ],
      { today: TODAY, horizonDays: 30, baseCurrency: "ARS" },
    );
    expect(model.totals.map((t) => t.currencyCode)).toEqual(["ARS", "USD"]);
    expect(model.excludedCurrencies).toEqual(["USD"]);
  });

  it("subtracts payments, drops fully-paid items and dedupes by source", () => {
    const model = buildObligationReadModel(
      [
        item({ sourceId: "a", dueDate: "2026-09-10", amount: "100000", paidAmount: "30000" }),
        item({ sourceId: "b", dueDate: "2026-09-11", amount: "50000", paidAmount: "50000" }),
        item({ sourceId: "a", dueDate: "2026-09-10", amount: "100000", paidAmount: "30000" }),
      ],
      { today: TODAY, horizonDays: 30, baseCurrency: "ARS" },
    );
    expect(model.items).toHaveLength(1);
    expect(model.items[0].remainingAmount).toBe("70000.00");
  });

  it("excludes items past the horizon and older than the overdue grace window", () => {
    const model = buildObligationReadModel(
      [
        item({ sourceId: "future", dueDate: "2026-12-01", amount: "1000" }),
        item({ sourceId: "ancient", dueDate: "2026-01-01", amount: "1000" }),
        item({ sourceId: "recent-overdue", dueDate: "2026-09-01", amount: "1000" }),
      ],
      { today: TODAY, horizonDays: 30, baseCurrency: "ARS", overdueGraceDays: 90 },
    );
    expect(model.items.map((i) => i.sourceId)).toEqual(["recent-overdue"]);
  });

  it("rolls a stale recurring date forward to the next occurrence on or after today", () => {
    expect(rollForwardRecurringDate("2026-06-15", "MONTHLY", "2026-09-05")).toBe("2026-09-15");
    expect(rollForwardRecurringDate("2026-01-31", "MONTHLY", "2026-03-01")).toBe("2026-03-31");
    expect(rollForwardRecurringDate("2024-02-29", "YEARLY", "2026-01-01")).toBe("2026-02-28");
    expect(rollForwardRecurringDate("2026-09-20", "MONTHLY", "2026-09-05")).toBe("2026-09-20");
  });
});
