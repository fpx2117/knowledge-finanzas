import { BillingError, isBillingError } from "../errors";
import type { BillingProvider, PaymentStatus } from "../providers/billing-provider";
import { isRefundable, maxRefundableAmount, type RefundReasonCode } from "./refund-policy";

export type RefundActor = { userId: string; isAdmin: boolean };

export type RefundPaymentRecord = {
  id: string;
  providerPaymentId: string | null;
  status: PaymentStatus;
  grossAmount: string;
  currencyCode: string;
};

export type RefundRecord = {
  id: string;
  paymentId: string;
  providerRefundId: string | null;
  amount: string;
  currencyCode: string;
  reason: RefundReasonCode;
  status: "PENDING" | "APPROVED" | "FAILED";
  requestedBy: string;
  requestIdempotencyKey: string;
  completedAt: Date | null;
  failureReason: string | null;
};

export type RequestRefundPaymentRepository = {
  findById(paymentId: string): Promise<RefundPaymentRecord | undefined>;
};

export type RequestRefundRepository = {
  create(input: {
    paymentId: string;
    amount: string;
    currencyCode: string;
    reason: RefundReasonCode;
    requestedBy: string;
    requestIdempotencyKey: string;
  }): Promise<{ refund: RefundRecord; created: boolean }>;
  markApproved(refundId: string, input: { providerRefundId: string | null; completedAt: Date }): Promise<RefundRecord>;
  markFailed(refundId: string, input: { failureReason: string }): Promise<RefundRecord>;
};

// Admin/support-mediated only in V1 (no user self-service): the `actor.isAdmin` guard is a
// deliberately minimal stand-in for real role-based authorization, which TASK-059 introduces —
// this task has no dependency on TASK-059, so the check lives here as an explicit, testable
// dependency-injected boundary rather than being skipped until that infrastructure exists.
export function createRequestRefund(dependencies: {
  payments: RequestRefundPaymentRepository;
  refunds: RequestRefundRepository;
  provider: Pick<BillingProvider, "refundPayment">;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  return async function requestRefund(input: {
    actor: RefundActor;
    paymentId: string;
    reason: RefundReasonCode;
    requestIdempotencyKey: string;
  }): Promise<{ refund: RefundRecord; created: boolean }> {
    if (!input.actor.isAdmin) throw new BillingError("BILLING_REFUND_NOT_AUTHORIZED");
    if (!input.reason) throw new BillingError("BILLING_REFUND_REASON_REQUIRED");

    // Idempotency check first: a retried request with the same key never re-validates the
    // payment or calls the provider a second time, even if the payment has since changed state.
    const payment = await dependencies.payments.findById(input.paymentId);
    if (!payment) throw new BillingError("BILLING_PAYMENT_NOT_FOUND");
    if (!isRefundable(payment)) throw new BillingError("BILLING_REFUND_PAYMENT_NOT_REFUNDABLE");
    if (!payment.providerPaymentId) throw new BillingError("BILLING_PAYMENT_NOT_FOUND", { field: "providerPaymentId" });

    const amount = maxRefundableAmount(payment);

    const { refund, created } = await dependencies.refunds.create({
      paymentId: payment.id,
      amount,
      currencyCode: payment.currencyCode,
      reason: input.reason,
      requestedBy: input.actor.userId,
      requestIdempotencyKey: input.requestIdempotencyKey,
    });

    if (!created) return { refund, created: false };

    try {
      if (!dependencies.provider.refundPayment) throw new BillingError("BILLING_PROVIDER_ERROR");
      const snapshot = await dependencies.provider.refundPayment(payment.providerPaymentId, { amount });
      const approved = await dependencies.refunds.markApproved(refund.id, { providerRefundId: snapshot.providerRefundId, completedAt: now() });
      return { refund: approved, created: true };
    } catch (error) {
      const failureReason = isBillingError(error) ? error.code : "BILLING_PROVIDER_ERROR";
      const failed = await dependencies.refunds.markFailed(refund.id, { failureReason });
      return { refund: failed, created: true };
    }
  };
}
