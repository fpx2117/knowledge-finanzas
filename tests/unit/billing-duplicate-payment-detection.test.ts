import { describe, expect, it, vi } from "vitest";
import { createDetectDuplicatePayments, detectDuplicatePayments } from "@know-finanzas/billing";

describe("detectDuplicatePayments", () => {
  it("flags two payments approved against the same subscription/billing period", () => {
    const cases = detectDuplicatePayments([
      { id: "p1", subscriptionId: "sub-1", billingPeriodId: "period-1" },
      { id: "p2", subscriptionId: "sub-1", billingPeriodId: "period-1" },
    ]);

    expect(cases).toEqual([{ subscriptionId: "sub-1", billingPeriodId: "period-1", paymentIds: ["p1", "p2"] }]);
  });

  it("does not flag a single payment per period", () => {
    const cases = detectDuplicatePayments([{ id: "p1", subscriptionId: "sub-1", billingPeriodId: "period-1" }]);
    expect(cases).toEqual([]);
  });

  it("does not flag payments across different periods or subscriptions", () => {
    const cases = detectDuplicatePayments([
      { id: "p1", subscriptionId: "sub-1", billingPeriodId: "period-1" },
      { id: "p2", subscriptionId: "sub-1", billingPeriodId: "period-2" },
      { id: "p3", subscriptionId: "sub-2", billingPeriodId: "period-1" },
    ]);
    expect(cases).toEqual([]);
  });

  it("ignores payments with no billing period (not yet materialized into a period)", () => {
    const cases = detectDuplicatePayments([
      { id: "p1", subscriptionId: "sub-1", billingPeriodId: null },
      { id: "p2", subscriptionId: "sub-1", billingPeriodId: null },
    ]);
    expect(cases).toEqual([]);
  });

  it("reports multiple independent duplicate cases in one pass", () => {
    const cases = detectDuplicatePayments([
      { id: "p1", subscriptionId: "sub-1", billingPeriodId: "period-1" },
      { id: "p2", subscriptionId: "sub-1", billingPeriodId: "period-1" },
      { id: "p3", subscriptionId: "sub-2", billingPeriodId: "period-5" },
      { id: "p4", subscriptionId: "sub-2", billingPeriodId: "period-5" },
    ]);
    expect(cases).toHaveLength(2);
  });
});

describe("createDetectDuplicatePayments", () => {
  it("wires the repository's payment list through the pure detection rule", async () => {
    const payments = { listApprovedWithPeriod: vi.fn(async () => [
      { id: "p1", subscriptionId: "sub-1", billingPeriodId: "period-1" },
      { id: "p2", subscriptionId: "sub-1", billingPeriodId: "period-1" },
    ]) };
    const detect = createDetectDuplicatePayments({ payments });

    const cases = await detect();

    expect(payments.listApprovedWithPeriod).toHaveBeenCalledTimes(1);
    expect(cases).toEqual([{ subscriptionId: "sub-1", billingPeriodId: "period-1", paymentIds: ["p1", "p2"] }]);
  });
});
