import { describe, expect, it } from "vitest";
import { deriveFinancialMetrics } from "@know-finanzas/privacy";

describe("deriveFinancialMetrics", () => {
  it("computes savings_rate as (income - consumption) / income", () => {
    const result = deriveFinancialMetrics({ currency: "ARS", totalIncome: "1000", totalConsumption: "700", totalDebtPayments: "0" });
    expect(result.savingsRate).toBeCloseTo(0.3);
  });

  it("computes debt_service_ratio as debtPayments / income", () => {
    const result = deriveFinancialMetrics({ currency: "ARS", totalIncome: "1000", totalConsumption: "700", totalDebtPayments: "200" });
    expect(result.debtServiceRatio).toBeCloseTo(0.2);
  });

  it("returns null for both metrics when income is zero (undefined, not divide-by-zero)", () => {
    const result = deriveFinancialMetrics({ currency: "ARS", totalIncome: "0", totalConsumption: "50", totalDebtPayments: "0" });
    expect(result).toEqual({ savingsRate: null, debtServiceRatio: null });
  });

  it("allows a negative savings rate when consumption exceeds income", () => {
    const result = deriveFinancialMetrics({ currency: "ARS", totalIncome: "1000", totalConsumption: "1500", totalDebtPayments: "0" });
    expect(result.savingsRate).toBeCloseTo(-0.5);
  });
});
