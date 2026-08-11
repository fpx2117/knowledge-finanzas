import { isBillingError } from "../errors";
import type { BillingProvider } from "../providers/billing-provider";
import type { RefundPaymentRecord, RefundRecord } from "./request-refund";

export type ReconcileRefundRepository = {
  // Unscoped by design: this runs as a system/cron job, not on behalf of a single user.
  listPending(): Promise<RefundRecord[]>;
  markApproved(refundId: string, input: { providerRefundId: string | null; completedAt: Date }): Promise<RefundRecord>;
  markFailed(refundId: string, input: { failureReason: string }): Promise<RefundRecord>;
};

export type ReconcileRefundPaymentRepository = {
  findById(paymentId: string): Promise<RefundPaymentRecord | undefined>;
};

export type ReconcileRefundResult =
  | { refundId: string; ok: true; status: "APPROVED" | "PENDING" }
  | { refundId: string; ok: false; errorCode: string };

// Recovers a refund left PENDING because the provider call succeeded but the local write that
// should have marked it APPROVED failed (or crashed) before persisting — same "partial failure"
// case documented for subscription reconciliation. Since a refund whose local write failed may
// never have persisted its provider_refund_id, this asks the provider for the payment's current
// status rather than requiring getRefund/a stored refund id. One refund's failure never aborts
// the batch — each is isolated and reported.
export function createReconcileRefund(dependencies: {
  refunds: ReconcileRefundRepository;
  payments: ReconcileRefundPaymentRepository;
  provider: Pick<BillingProvider, "getPayment">;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  return async function reconcileRefund(): Promise<{ reconciled: number; stillPending: number; failed: number; results: ReconcileRefundResult[] }> {
    const candidates = await dependencies.refunds.listPending();
    const results: ReconcileRefundResult[] = [];

    for (const refund of candidates) {
      try {
        const payment = await dependencies.payments.findById(refund.paymentId);
        if (!payment?.providerPaymentId) {
          results.push({ refundId: refund.id, ok: false, errorCode: "BILLING_PAYMENT_NOT_FOUND" });
          continue;
        }

        const snapshot = await dependencies.provider.getPayment(payment.providerPaymentId);
        if (snapshot.status === "REFUNDED") {
          await dependencies.refunds.markApproved(refund.id, { providerRefundId: refund.providerRefundId, completedAt: now() });
          results.push({ refundId: refund.id, ok: true, status: "APPROVED" });
        } else {
          // Provider truth wins: still not refunded at the provider, so the refund genuinely
          // hasn't happened yet — leave it PENDING for the next reconciliation pass rather than
          // guessing.
          results.push({ refundId: refund.id, ok: true, status: "PENDING" });
        }
      } catch (error) {
        results.push({ refundId: refund.id, ok: false, errorCode: isBillingError(error) ? error.code : "BILLING_RECONCILIATION_FAILED" });
      }
    }

    return {
      reconciled: results.filter((result) => result.ok && result.status === "APPROVED").length,
      stillPending: results.filter((result) => result.ok && result.status === "PENDING").length,
      failed: results.filter((result) => !result.ok).length,
      results,
    };
  };
}
