import { describe, expect, it } from "vitest";
import { calculateBudget, Money, resolveBudgetAlertType } from "@know-finanzas/finance";

describe("budget engine", () => {
  it("computes normal usage well under the limit", () => {
    const result = calculateBudget({ limit: Money.fromString("200", "ARS"), spent: Money.fromString("50", "ARS") });
    expect(result.spent.toString()).toBe("50.00");
    expect(result.remaining.toString()).toBe("150.00");
    expect(result.usagePercent.toFixed(0)).toBe("25");
    expect(result.status).toBe("NORMAL");
  });

  it("flags near-limit usage at the default 80% threshold", () => {
    const result = calculateBudget({ limit: Money.fromString("100", "ARS"), spent: Money.fromString("80", "ARS") });
    expect(result.usagePercent.toFixed(0)).toBe("80");
    expect(result.status).toBe("NEAR_LIMIT");
  });

  it("treats spent equal to limit as near-limit with zero remaining", () => {
    const result = calculateBudget({ limit: Money.fromString("100", "ARS"), spent: Money.fromString("100", "ARS") });
    expect(result.remaining.toString()).toBe("0.00");
    expect(result.status).toBe("NEAR_LIMIT");
  });

  it("flags exceeded usage with negative remaining above 100%", () => {
    const result = calculateBudget({ limit: Money.fromString("100", "ARS"), spent: Money.fromString("120", "ARS") });
    expect(result.remaining.toString()).toBe("-20.00");
    expect(result.usagePercent.toFixed(0)).toBe("120");
    expect(result.status).toBe("EXCEEDED");
  });

  it("nets refunds against expenses before calculating usage", () => {
    const expense = Money.fromString("100", "ARS");
    const refund = Money.fromString("40", "ARS");
    const spent = expense.subtract(refund);
    const result = calculateBudget({ limit: Money.fromString("200", "ARS"), spent });
    expect(result.spent.toString()).toBe("60.00");
  });

  it("respects a configurable near-limit threshold", () => {
    const result = calculateBudget({ limit: Money.fromString("100", "ARS"), spent: Money.fromString("60", "ARS"), nearLimitThresholdPercent: 50 });
    expect(result.status).toBe("NEAR_LIMIT");
  });

  it("rejects mismatched currencies between limit and spent", () => {
    expect(() => calculateBudget({ limit: Money.fromString("100", "ARS"), spent: Money.fromString("10", "USD") })).toThrow("Currency mismatch");
  });
});

describe("budget alert threshold transitions", () => {
  it("maps NORMAL to no alert", () => {
    expect(resolveBudgetAlertType("NORMAL")).toBeNull();
  });

  it("maps NEAR_LIMIT to BUDGET_NEAR_LIMIT", () => {
    expect(resolveBudgetAlertType("NEAR_LIMIT")).toBe("BUDGET_NEAR_LIMIT");
  });

  it("maps EXCEEDED to BUDGET_EXCEEDED", () => {
    expect(resolveBudgetAlertType("EXCEEDED")).toBe("BUDGET_EXCEEDED");
  });
});
