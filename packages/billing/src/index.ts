export type {
  BillingInterval,
  BillingPaymentStatus,
  BillingPeriodStatus,
  BillingProviderCode,
  BillingSubscriptionStatus,
  BillingWebhookEventStatus,
  EffectiveSubscriptionSnapshot,
  ProductAccessSource,
  ProductAccessState,
} from "./domain/billing-types";

export { BillingError, billingErrorCodes, isBillingError, type BillingErrorCode } from "./errors";

export { buildProMonthlyPlanSeed, PRO_MONTHLY_PLAN_CODE, type PlanSeed } from "./plans/catalog";
export { computeTrialEndsAt, isTrialActive } from "./plans/trial-policy";
export { isEffectivePaidSubscription, resolveProductAccess, resolveProductAccessSource, type ResolveProductAccessInput } from "./plans/resolver";
export {
  CAPABILITY_KEYS,
  createEntitlementService,
  ENTITLEMENT_MATRIX,
  hasCapability,
  hasEntitlement,
  listEntitlements,
  type CapabilityKey,
} from "./plans/entitlements";
export { assertNoConflictingSubscription, assertPlanActive } from "./plans/guards";
export { computeRemaining, isLimitReached, resolveLimit, UNLIMITED, type LimitConfig, type LimitKey, type LimitValue } from "./plans/limits";
export { buildProductAccessSummary, type ProductAccessSummary, type UsageSnapshot } from "./usage/plan-usage";

export type { BillingProvider, CreateSubscriptionRequest, CreateSubscriptionResult, PaymentSnapshot, PaymentStatus, RefundSnapshot, RefundStatus, SubscriptionSnapshot } from "./providers/billing-provider";
export { createMercadoPagoBillingProvider } from "./providers/mercadopago/provider";
export { createMercadoPagoClient, type MercadoPagoClientConfig } from "./providers/mercadopago/client";
export { buildCreatePreapprovalRequest, mapPaymentResponse, mapPaymentStatus, mapPreapprovalResponse, mapPreapprovalToSubscriptionSnapshot, mapRefundResponse, mapSubscriptionStatus } from "./providers/mercadopago/mapper";
export type { MercadoPagoCreatePreapprovalRequest, MercadoPagoPaymentResponse, MercadoPagoPreapprovalResponse, MercadoPagoRefundResponse } from "./providers/mercadopago/types";

export { verifyMercadoPagoSignature, buildMercadoPagoSignatureManifest, type MercadoPagoSignatureInput } from "./webhooks/verify-signature";
export { parseWebhookNotification, type MercadoPagoWebhookNotification } from "./webhooks/webhook-notification";

export {
  noopGrantProPeriodCredits,
  noopStartProWhatsAppAllowance,
  type GrantProPeriodCreditsPort,
  type ProPeriodGrantInput,
  type StartProWhatsAppAllowancePort,
} from "./subscriptions/ports";
export {
  createSubscriptionSynchronizer,
  type BillingPeriodRecord,
  type PaymentRepository,
  type PeriodRepository,
  type SubscriptionRecord as SynchronizerSubscriptionRecord,
  type SubscriptionRepository as SynchronizerSubscriptionRepository,
} from "./subscriptions/synchronize-subscription";

export { createMercadoPagoWebhookProcessor, type ProcessWebhookResult, type WebhookEventRepository } from "./webhooks/process-webhook";
export { createRetryWebhookEvent, type RetryWebhookEventRepository, type RetryWebhookEventResult } from "./webhooks/retry-webhook-event";

export { createCancelSubscription, type CancelSubscriptionRepository } from "./subscriptions/cancel-subscription";
export { createRefreshSubscriptionFromProvider, type RefreshSubscriptionRepository } from "./subscriptions/refresh-subscription";
export { createReconcileSubscriptions, type ReconcileSubscriptionResult, type ReconcileSubscriptionsRepository } from "./subscriptions/reconcile-subscriptions";
export { createHandlePaymentFailure, type HandlePaymentFailureRepository } from "./subscriptions/handle-payment-failure";
export { createExpirePastDueSubscriptions, type ExpirePastDueSubscriptionsRepository, type ExpirePastDueResult } from "./subscriptions/expire-past-due-subscriptions";

export { isRefundable, maxRefundableAmount, resolveRefundAccessEffect, type RefundAccessEffect, type RefundReasonCode } from "./refunds/refund-policy";
export {
  createRequestRefund,
  type RefundActor,
  type RefundPaymentRecord,
  type RefundRecord,
  type RequestRefundPaymentRepository,
  type RequestRefundRepository,
} from "./refunds/request-refund";
export { createReconcileRefund, type ReconcileRefundPaymentRepository, type ReconcileRefundRepository, type ReconcileRefundResult } from "./refunds/reconcile-refund";
export {
  createDetectDuplicatePayments,
  detectDuplicatePayments,
  type DetectDuplicatePaymentsRepository,
  type DuplicatePaymentCase,
  type PaymentForDuplicateCheck,
} from "./refunds/duplicate-payment-detection";

export {
  createRecordDisputeEvent,
  type DisputeRecord,
  type DisputeStatus,
  type RecordDisputeEventPaymentRepository,
  type RecordDisputeEventRepository,
  type RecordDisputeEventResult,
} from "./disputes/record-dispute-event";

export {
  createStartTrial,
  isEligibleForTrial,
  type GrantTrialCredits,
  type StartTrialPromotionsRepository,
  type StartTrialSubscriptionsRepository,
  type StartTrialUsersRepository,
} from "./trial/start-trial";
