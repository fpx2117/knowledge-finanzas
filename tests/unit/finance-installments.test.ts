import { describe, expect, it } from "vitest";
import { Money, generateInstallmentDates, generateInstallments, validateInstallmentPreview } from "@know-finanzas/finance";

describe("installment engine", () => {
  it("splits exact totals with the remainder on the last installment", () => {
    const result = generateInstallments({ totalPayable: Money.fromPositiveString("100", "USD"), installmentCount: 3, firstDueDate: "2026-01-15", frequency: "MONTHLY" });
    expect(result.installments.map((item) => item.totalAmount.toString())).toEqual(["33.33", "33.33", "33.34"]);
  });

  it("preserves the monthly anchor across short months and leap years", () => {
    expect(generateInstallmentDates({ firstDueDate: "2026-01-31", installmentCount: 4, frequency: "MONTHLY" })).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
    expect(generateInstallmentDates({ firstDueDate: "2028-01-31", installmentCount: 3, frequency: "MONTHLY" })).toEqual(["2028-01-31", "2028-02-29", "2028-03-31"]);
  });

  it("generates weekly and biweekly dates", () => {
    expect(generateInstallmentDates({ firstDueDate: "2026-01-05", installmentCount: 3, frequency: "WEEKLY" })).toEqual(["2026-01-05", "2026-01-12", "2026-01-19"]);
    expect(generateInstallmentDates({ firstDueDate: "2026-01-05", installmentCount: 3, frequency: "BIWEEKLY" })).toEqual(["2026-01-05", "2026-01-19", "2026-02-02"]);
  });

  it("validates an edited manual preview without persistence", () => {
    const total = Money.fromPositiveString("100", "ARS");
    const preview = validateInstallmentPreview({ totalPayable: total, installments: [
      { installmentNumber: 1, dueDate: "2026-01-15", totalAmount: Money.fromString("40", "ARS") },
      { installmentNumber: 2, dueDate: "2026-02-15", totalAmount: Money.fromString("60", "ARS") },
    ] });
    expect(preview.installments).toHaveLength(2);
  });

  it("rejects non-positive installments, bad sequence and mismatched totals", () => {
    expect(() => generateInstallments({ totalPayable: Money.fromPositiveString("0.02", "USD"), installmentCount: 3, firstDueDate: "2026-01-01", frequency: "MONTHLY" })).toThrow("TOTAL_TOO_SMALL");
    expect(() => validateInstallmentPreview({ totalPayable: Money.fromString("100", "ARS"), installments: [{ installmentNumber: 2, dueDate: "2026-01-01", totalAmount: Money.fromString("100", "ARS") }] })).toThrow("NON_SEQUENTIAL");
    expect(() => validateInstallmentPreview({ totalPayable: Money.fromString("100", "ARS"), installments: [{ installmentNumber: 1, dueDate: "2026-01-01", totalAmount: Money.fromString("99", "ARS") }] })).toThrow("INSTALLMENT_TOTAL_MISMATCH");
  });
});
