import { describe, expect, it } from "vitest";
import { allocatePayment, Money } from "@know-finanzas/finance";

const installment = (id: string, number: number, dueDate: string, total: string, allocated = "0") => ({ id, installmentNumber: number, dueDate, totalAmount: Money.fromString(total, "USD"), allocatedAmount: Money.fromString(allocated, "USD"), status: "PENDING" as const });

describe("payment allocation engine", () => {
  it("allocates oldest due first across multiple installments", () => {
    const result = allocatePayment({ amount: Money.fromPositiveString("250", "USD"), installments: [installment("3", 3, "2026-03-01", "100"), installment("1", 1, "2026-01-01", "100"), installment("2", 2, "2026-02-01", "100")], strategy: "OLDEST_DUE_FIRST" });
    expect(result.allocations.map((item) => item.amount.toString())).toEqual(["100.00", "100.00", "50.00"]);
    expect(result.debtRemainingAfter.toString()).toBe("50.00");
  });

  it("supports partial and non-consecutive manual allocations", () => {
    const result = allocatePayment({ amount: Money.fromPositiveString("200", "USD"), installments: [installment("4", 4, "2026-04-01", "100"), installment("5", 5, "2026-05-01", "100"), installment("6", 6, "2026-06-01", "100")], strategy: "MANUAL", allocations: [{ installmentId: "4", amount: Money.fromString("100", "USD") }, { installmentId: "6", amount: Money.fromString("100", "USD") }] });
    expect(result.allocations.map((item) => item.installmentId)).toEqual(["4", "6"]);
  });

  it("rejects overpayment, duplicate allocations and paid/cancelled installments", () => {
    expect(() => allocatePayment({ amount: Money.fromPositiveString("301", "USD"), installments: [installment("1", 1, "2026-01-01", "300")], strategy: "OLDEST_DUE_FIRST" })).toThrow("PAYMENT_EXCEEDS_DEBT_REMAINING");
    expect(() => allocatePayment({ amount: Money.fromPositiveString("100", "USD"), installments: [installment("1", 1, "2026-01-01", "100")], strategy: "MANUAL", allocations: [{ installmentId: "1", amount: Money.fromString("50", "USD") }, { installmentId: "1", amount: Money.fromString("50", "USD") }] })).toThrow("DUPLICATE_ALLOCATION");
    expect(() => allocatePayment({ amount: Money.fromPositiveString("100", "USD"), installments: [{ ...installment("1", 1, "2026-01-01", "100"), status: "PAID" }], strategy: "MANUAL", allocations: [{ installmentId: "1", amount: Money.fromString("100", "USD") }] })).toThrow("INSTALLMENT_NOT_PAYABLE");
  });

  it("rejects currency mismatch and allocation beyond remaining", () => {
    expect(() => allocatePayment({ amount: Money.fromPositiveString("100", "ARS"), installments: [installment("1", 1, "2026-01-01", "100")], strategy: "OLDEST_DUE_FIRST" })).toThrow("PAYMENT_CURRENCY_MISMATCH");
    expect(() => allocatePayment({ amount: Money.fromPositiveString("110", "USD"), installments: [installment("1", 1, "2026-01-01", "100")], strategy: "MANUAL", allocations: [{ installmentId: "1", amount: Money.fromString("110", "USD") }] })).toThrow("PAYMENT_EXCEEDS_DEBT_REMAINING");
  });
});
