import type { PaymentStatus } from "../providers/billing-provider";

export type RefundReasonCode = "DUPLICATE_CHARGE" | "SERVICE_FAILURE" | "FULL_SUBSCRIPTION_REVERSAL";

// V1 only ever refunds APPROVED payments — a PENDING/REJECTED/CANCELLED payment never moved
// money, and an already-REFUNDED payment would double-refund.
export function isRefundable(payment: { status: PaymentStatus }): boolean {
  return payment.status === "APPROVED";
}

// V1 scope: full refund only (see task's Out of Scope) — the refundable amount is always the
// payment's full gross amount.
export function maxRefundableAmount(payment: { grossAmount: string }): string {
  return payment.grossAmount;
}

export type RefundAccessEffect = "KEEP_ACCESS" | "REVOKE_ACCESS";

// docs/10-6.subscription-cancellation-refunds.md domain rule: a refund is never automatically a
// cancellation. DUPLICATE_CHARGE never touches access (the subscriber still has one valid
// payment backing their period). FULL_SUBSCRIPTION_REVERSAL always ends paid entitlement — it
// exists specifically to unwind a payment that should never have counted as active access.
// SERVICE_FAILURE is judgment-call territory; the admin issuing the refund states the intended
// effect explicitly rather than this policy guessing.
export function resolveRefundAccessEffect(reason: RefundReasonCode, input: { revokeAccess?: boolean } = {}): RefundAccessEffect {
  switch (reason) {
    case "DUPLICATE_CHARGE":
      return "KEEP_ACCESS";
    case "FULL_SUBSCRIPTION_REVERSAL":
      return "REVOKE_ACCESS";
    case "SERVICE_FAILURE":
      return input.revokeAccess ? "REVOKE_ACCESS" : "KEEP_ACCESS";
  }
}
