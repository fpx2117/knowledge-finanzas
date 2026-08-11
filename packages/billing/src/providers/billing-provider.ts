import type { BillingSubscriptionStatus } from "../domain/billing-types";

export type CreateSubscriptionRequest = {
  externalReference: string;
  payerEmail: string;
  reason: string;
  backUrl: string;
  amount: string;
  currencyCode: string;
};

export type CreateSubscriptionResult = {
  providerSubscriptionId: string;
  status: BillingSubscriptionStatus;
  checkoutUrl: string;
};

export type SubscriptionSnapshot = {
  providerSubscriptionId: string;
  externalReference: string | null;
  status: BillingSubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELLED";

export type PaymentSnapshot = {
  providerPaymentId: string;
  externalReference: string | null;
  status: PaymentStatus;
  grossAmount: string;
  currencyCode: string;
  providerFee: string | null;
  netAmount: string | null;
  paidAt: Date | null;
};

export type RefundStatus = "PENDING" | "APPROVED" | "FAILED";

export type RefundSnapshot = {
  providerRefundId: string;
  status: RefundStatus;
  amount: string;
};

export interface BillingProvider {
  // Verified per docs/adr/ADR-002-mercadopago-cancellation-semantics.md: Mercado Pago's
  // preapproval API has no scheduled/period-end cancellation, and only PAUSED subscriptions
  // (not CANCELLED ones) support reactivation. Both are fixed capability flags rather than
  // runtime-detected, since they reflect a verified, documented provider limit.
  readonly supportsCancelAtPeriodEnd: boolean;
  readonly supportsReactivation: boolean;
  // TASK-058 V1 scope: only full refunds are issued (see task's Out of Scope), even though
  // Mercado Pago's API can accept a partial amount — this flag reflects what RequestRefund
  // actually does, not the provider's raw capability.
  readonly supportsPartialRefund: boolean;
  readonly supportsRefundLookup: boolean;
  createSubscription(input: CreateSubscriptionRequest): Promise<CreateSubscriptionResult>;
  getSubscription(providerSubscriptionId: string): Promise<SubscriptionSnapshot>;
  // Cancels immediately at the provider (no scheduled/period-end cancellation — provider
  // semantics win, see docs/10-billing-subscriptions-mercadopago.md §45-46) and returns the
  // resulting snapshot so the caller can feed it straight into the subscription synchronizer.
  cancelSubscription(providerSubscriptionId: string): Promise<SubscriptionSnapshot>;
  getPayment(providerPaymentId: string): Promise<PaymentSnapshot>;
  // Optional: not every BillingProvider implementation/test fake needs a refund path wired up.
  // RequestRefund/ReconcileRefund fail with BILLING_PROVIDER_ERROR if called against a provider
  // that doesn't implement these.
  refundPayment?(providerPaymentId: string, input: { amount: string }): Promise<RefundSnapshot>;
  getRefund?(providerPaymentId: string, providerRefundId: string): Promise<RefundSnapshot>;
}
