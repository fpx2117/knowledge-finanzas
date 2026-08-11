import { describe, expect, it } from "vitest";
import { normalizeProjectionInputs } from "@know-finanzas/finance";
describe("projection inputs", () => {
  it("normalizes committed debt and expected scheduled events without mixing sources", () => {
    const result = normalizeProjectionInputs({ userId: "u1", timezone: "UTC", horizon: { start: "2026-08-01", end: "2026-09-01" }, debtRows: [{ id: "i1", debtId: "d1", debtName: "Loan", installmentNumber: 1, date: "2026-08-10", totalAmount: "100.00", allocatedAmount: "40.00", currencyCode: "ARS" }], scheduledRows: [{ id: "s1", date: "2026-08-15", type: "EXPENSE", expectedAmount: "200.00", currencyCode: "ARS", description: "Rent", accountId: "a1", categoryId: null, recurringTransactionId: "r1" }] });
    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toMatchObject({ sourceType: "DEBT_INSTALLMENT", remainingAmount: "60.00", confidence: "COMMITTED" });
    expect(result.events[1]).toMatchObject({ sourceType: "SCHEDULED_TRANSACTION", confidence: "EXPECTED", recurringTransactionId: "r1" });
  });
  it("deduplicates by source identity and preserves separate currencies", () => {
    const item = { id: "i1", debtId: "d1", debtName: "Loan", installmentNumber: 1, date: "2026-08-10", totalAmount: "100.00", allocatedAmount: "0", currencyCode: "USD" };
    const result = normalizeProjectionInputs({ userId: "u1", timezone: "UTC", horizon: { start: "2026-08-01", end: "2026-09-01" }, debtRows: [item, item], scheduledRows: [] });
    expect(result.events).toHaveLength(1);
    expect(result.events[0].currencyCode).toBe("USD");
  });
});
