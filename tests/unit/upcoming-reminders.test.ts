import { describe, expect, it } from "vitest";
import { classifyUpcomingDate, reminderDedupKey, resolveReminderAt, sortAndDedupeUpcoming } from "@know-finanzas/finance";
describe("planning read models and reminders", () => {
  it("groups dates and deduplicates only by source identity", () => {
    expect(classifyUpcomingDate("2026-08-08", "2026-08-09")).toBe("OVERDUE"); expect(classifyUpcomingDate("2026-08-09", "2026-08-09")).toBe("DUE_TODAY");
    const item = { sourceType: "SCHEDULED_TRANSACTION" as const, sourceId: "s1", direction: "OUTFLOW" as const, title: "Rent", date: "2026-08-10", amount: "100", remainingAmount: null, currencyCode: "ARS", status: "UPCOMING" as const, confidence: "EXPECTED" as const, accountId: null, categoryId: null, debtId: null, installmentNumber: null, recurringTransactionId: null };
    expect(sortAndDedupeUpcoming([item, { ...item, title: "Changed" }])).toHaveLength(1);
  });
  it("creates deterministic reminder keys and timezone instants", () => {
    expect(reminderDedupKey("DEBT_INSTALLMENT", "i1", "BEFORE_1_DAY")).toBe("v1:DEBT_INSTALLMENT:i1:BEFORE_1_DAY:-");
    expect(resolveReminderAt("2026-02-28", "09:00", "America/Argentina/Buenos_Aires").toISOString()).toBe("2026-02-28T12:00:00.000Z");
  });
});
