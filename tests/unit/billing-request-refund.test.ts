import { describe, expect, it, vi } from "vitest";
import { createRequestRefund, type RefundPaymentRecord, type RefundRecord } from "@know-finanzas/billing";

const approvedPayment: RefundPaymentRecord = { id: "pay-1", providerPaymentId: "mp-pay-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD" };

function fakeRefundStore(seed: RefundRecord[] = []) {
  const records = [...seed];
  let nextId = 1;
  return {
    records,
    create: vi.fn(async (input: { paymentId: string; amount: string; currencyCode: string; reason: RefundRecord["reason"]; requestedBy: string; requestIdempotencyKey: string }) => {
      const existing = records.find((r) => r.requestIdempotencyKey === input.requestIdempotencyKey);
      if (existing) return { refund: existing, created: false };
      const refund: RefundRecord = { id: `refund-${nextId++}`, paymentId: input.paymentId, providerRefundId: null, amount: input.amount, currencyCode: input.currencyCode, reason: input.reason, status: "PENDING", requestedBy: input.requestedBy, requestIdempotencyKey: input.requestIdempotencyKey, completedAt: null, failureReason: null };
      records.push(refund);
      return { refund, created: true };
    }),
    markApproved: vi.fn(async (id: string, input: { providerRefundId: string | null; completedAt: Date }) => {
      const refund = records.find((r) => r.id === id)!;
      refund.status = "APPROVED";
      refund.providerRefundId = input.providerRefundId;
      refund.completedAt = input.completedAt;
      return refund;
    }),
    markFailed: vi.fn(async (id: string, input: { failureReason: string }) => {
      const refund = records.find((r) => r.id === id)!;
      refund.status = "FAILED";
      refund.failureReason = input.failureReason;
      return refund;
    }),
  };
}

function fakePayments(payment: RefundPaymentRecord | undefined) {
  return { findById: vi.fn(async () => payment) };
}

describe("createRequestRefund", () => {
  it("rejects a non-admin actor", async () => {
    const refunds = fakeRefundStore();
    const requestRefund = createRequestRefund({ payments: fakePayments(approvedPayment), refunds, provider: {} });

    await expect(requestRefund({ actor: { userId: "u1", isAdmin: false }, paymentId: "pay-1", reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "key-1" }))
      .rejects.toThrow("BILLING_REFUND_NOT_AUTHORIZED");
    expect(refunds.create).not.toHaveBeenCalled();
  });

  it("rejects a request without a reason", async () => {
    const refunds = fakeRefundStore();
    const requestRefund = createRequestRefund({ payments: fakePayments(approvedPayment), refunds, provider: {} });

    await expect(requestRefund({ actor: { userId: "admin-1", isAdmin: true }, paymentId: "pay-1", reason: "" as never, requestIdempotencyKey: "key-1" }))
      .rejects.toThrow("BILLING_REFUND_REASON_REQUIRED");
  });

  it("rejects a request for a payment that does not exist", async () => {
    const refunds = fakeRefundStore();
    const requestRefund = createRequestRefund({ payments: fakePayments(undefined), refunds, provider: {} });

    await expect(requestRefund({ actor: { userId: "admin-1", isAdmin: true }, paymentId: "missing", reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "key-1" }))
      .rejects.toThrow("BILLING_PAYMENT_NOT_FOUND");
  });

  it("rejects a request for a payment that is not refundable", async () => {
    const refunds = fakeRefundStore();
    const pendingPayment: RefundPaymentRecord = { ...approvedPayment, status: "PENDING" };
    const requestRefund = createRequestRefund({ payments: fakePayments(pendingPayment), refunds, provider: {} });

    await expect(requestRefund({ actor: { userId: "admin-1", isAdmin: true }, paymentId: "pay-1", reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "key-1" }))
      .rejects.toThrow("BILLING_REFUND_PAYMENT_NOT_REFUNDABLE");
  });

  it("creates a refund via the provider and marks it APPROVED with the provider's refund id", async () => {
    const refunds = fakeRefundStore();
    const refundPayment = vi.fn(async () => ({ providerRefundId: "mp-refund-1", status: "APPROVED" as const, amount: "7.99" }));
    const requestRefund = createRequestRefund({ payments: fakePayments(approvedPayment), refunds, provider: { refundPayment }, now: () => new Date("2026-01-15T00:00:00Z") });

    const result = await requestRefund({ actor: { userId: "admin-1", isAdmin: true }, paymentId: "pay-1", reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "key-1" });

    expect(result).toEqual({ refund: expect.objectContaining({ status: "APPROVED", providerRefundId: "mp-refund-1", amount: "7.99" }), created: true });
    expect(refundPayment).toHaveBeenCalledWith("mp-pay-1", { amount: "7.99" });
  });

  it("marks the refund FAILED, never fabricating success, when the provider call fails", async () => {
    const refunds = fakeRefundStore();
    const refundPayment = vi.fn(async () => { throw new Error("provider timeout"); });
    const requestRefund = createRequestRefund({ payments: fakePayments(approvedPayment), refunds, provider: { refundPayment } });

    const result = await requestRefund({ actor: { userId: "admin-1", isAdmin: true }, paymentId: "pay-1", reason: "SERVICE_FAILURE", requestIdempotencyKey: "key-1" });

    expect(result.refund.status).toBe("FAILED");
    expect(result.refund.failureReason).toBe("BILLING_PROVIDER_ERROR");
  });

  it("retrying the same idempotency key never calls the provider a second time", async () => {
    const refunds = fakeRefundStore();
    const refundPayment = vi.fn(async () => ({ providerRefundId: "mp-refund-1", status: "APPROVED" as const, amount: "7.99" }));
    const requestRefund = createRequestRefund({ payments: fakePayments(approvedPayment), refunds, provider: { refundPayment } });

    const first = await requestRefund({ actor: { userId: "admin-1", isAdmin: true }, paymentId: "pay-1", reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "key-1" });
    const second = await requestRefund({ actor: { userId: "admin-1", isAdmin: true }, paymentId: "pay-1", reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "key-1" });

    expect(refundPayment).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ refund: first.refund, created: false });
  });
});
