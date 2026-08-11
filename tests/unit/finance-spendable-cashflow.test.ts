import { describe, expect, it } from "vitest";
import { calculateCashflow, calculateSpendable, Money } from "@know-finanzas/finance";

const event = (date: string, direction: "INFLOW" | "OUTFLOW", amount: string, confidence: "EXPECTED" | "COMMITTED" = "EXPECTED") => ({ sourceId: `${date}-${amount}`, sourceType: "SCHEDULED", date, direction, amount: Money.fromString(amount, "ARS"), confidence, title: "Event" });

describe("spendable and cashflow engines", () => {
  it("subtracts only committed obligations and allows negative spendable", () => {
    const result = calculateSpendable({ currency: "ARS", liquidBalance: Money.fromString("300", "ARS"), horizonStart: "2026-08-01", horizonEnd: "2026-08-30", obligations: [{ sourceId: "i1", title: "Debt", dueDate: "2026-08-10", remainingAmount: Money.fromString("500", "ARS"), isOverdue: false }] });
    expect(result.spendable.toString()).toBe("-200.00");
  });

  it("projects same-day flows as one end-of-day change", () => {
    const result = calculateCashflow({ currency: "ARS", startingBalance: Money.fromString("500", "ARS"), horizonStart: "2026-08-01", horizonEnd: "2026-08-03", events: [event("2026-08-02", "INFLOW", "100"), event("2026-08-02", "OUTFLOW", "800")] });
    expect(result.points[1].projectedBalance.toString()).toBe("-200.00");
    expect(result.firstNegativeDate).toBe("2026-08-02");
    expect(result.shortfallAmount?.toString()).toBe("200.00");
  });

  it("keeps future income out of spendable but includes it in cashflow", () => {
    const spendable = calculateSpendable({ currency: "ARS", liquidBalance: Money.fromString("1000", "ARS"), horizonStart: "2026-08-01", horizonEnd: "2026-08-30", obligations: [] });
    const cashflow = calculateCashflow({ currency: "ARS", startingBalance: Money.fromString("1000", "ARS"), horizonStart: "2026-08-01", horizonEnd: "2026-08-30", events: [event("2026-08-10", "INFLOW", "500")] });
    expect(spendable.spendable.toString()).toBe("1000.00");
    expect(cashflow.projectedEndBalance.toString()).toBe("1500.00");
  });

  it("keeps currencies separate and produces a deterministic empty projection", () => {
    const result = calculateCashflow({ currency: "USD", startingBalance: Money.fromString("500", "USD"), horizonStart: "2026-08-01", horizonEnd: "2026-08-03", events: [] });
    expect(result.points).toHaveLength(3);
    expect(result.projectedEndBalance.toString()).toBe("500.00");
    expect(result.minimumProjectedBalance.toString()).toBe("500.00");
    expect(result.firstNegativeDate).toBeNull();
  });
});
