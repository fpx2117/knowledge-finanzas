import { describe, expect, it, vi } from "vitest";
import { createReconcileRefund, type RefundPaymentRecord, type RefundRecord } from "@know-finanzas/billing";

function pendingRefund(overrides: Partial<RefundRecord> = {}): RefundRecord {
  return {
    id: "refund-1",
    paymentId: "pay-1",
    providerRefundId: null,
    amount: "7.99",
    currencyCode: "USD",
    reason: "DUPLICATE_CHARGE",
    status: "PENDING",
    requestedBy: "admin-1",
    requestIdempotencyKey: "key-1",
    completedAt: null,
    failureReason: null,
    ...overrides,
  };
}

describe("createReconcileRefund", () => {
  it("recovers a refund whose provider call succeeded but whose local write failed", async () => {
    const refund = pendingRefund();
    const refunds = { listPending: vi.fn(async () => [refund]), markApproved: vi.fn(async () => ({ ...refund, status: "APPROVED" as const })), markFailed: vi.fn() };
    const payments = { findById: vi.fn(async () => ({ id: "pay-1", providerPaymentId: "mp-pay-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD" }) as RefundPaymentRecord) };
    const provider = { getPayment: vi.fn(async () => ({ providerPaymentId: "mp-pay-1", externalReference: null, status: "REFUNDED" as const, grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: null })) };
    const reconcile = createReconcileRefund({ refunds, payments, provider, now: () => new Date("2026-01-15T00:00:00Z") });

    const result = await reconcile();

    expect(result).toMatchObject({ reconciled: 1, stillPending: 0, failed: 0 });
    expect(refunds.markApproved).toHaveBeenCalledWith("refund-1", { providerRefundId: null, completedAt: new Date("2026-01-15T00:00:00Z") });
  });

  it("leaves a refund PENDING when the provider still hasn't confirmed the refund", async () => {
    const refund = pendingRefund();
    const refunds = { listPending: vi.fn(async () => [refund]), markApproved: vi.fn(), markFailed: vi.fn() };
    const payments = { findById: vi.fn(async () => ({ id: "pay-1", providerPaymentId: "mp-pay-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD" }) as RefundPaymentRecord) };
    const provider = { getPayment: vi.fn(async () => ({ providerPaymentId: "mp-pay-1", externalReference: null, status: "APPROVED" as const, grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: null })) };
    const reconcile = createReconcileRefund({ refunds, payments, provider });

    const result = await reconcile();

    expect(result).toMatchObject({ reconciled: 0, stillPending: 1, failed: 0 });
    expect(refunds.markApproved).not.toHaveBeenCalled();
  });

  it("isolates one refund's failure from the rest of the batch", async () => {
    const okRefund = pendingRefund({ id: "refund-ok", paymentId: "pay-ok" });
    const brokenRefund = pendingRefund({ id: "refund-broken", paymentId: "pay-broken" });
    const refunds = { listPending: vi.fn(async () => [brokenRefund, okRefund]), markApproved: vi.fn(async (id: string) => ({ ...okRefund, id, status: "APPROVED" as const })), markFailed: vi.fn() };
    const payments = { findById: vi.fn(async (paymentId: string) => (paymentId === "pay-broken" ? undefined : ({ id: paymentId, providerPaymentId: "mp-pay-ok", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD" }) as RefundPaymentRecord)) };
    const provider = { getPayment: vi.fn(async () => ({ providerPaymentId: "mp-pay-ok", externalReference: null, status: "REFUNDED" as const, grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: null })) };
    const reconcile = createReconcileRefund({ refunds, payments, provider });

    const result = await reconcile();

    expect(result.failed).toBe(1);
    expect(result.reconciled).toBe(1);
    expect(result.results).toEqual(expect.arrayContaining([
      { refundId: "refund-broken", ok: false, errorCode: "BILLING_PAYMENT_NOT_FOUND" },
      { refundId: "refund-ok", ok: true, status: "APPROVED" },
    ]));
  });
});
