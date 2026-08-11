export type BillingProviderCode = "MERCADO_PAGO";
export type BillingInterval = "MONTHLY";

export type BillingSubscriptionStatus = "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";
export type BillingPeriodStatus = "PENDING" | "ACTIVE" | "CLOSED" | "FAILED";
export type BillingPaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELLED";
export type BillingWebhookEventStatus = "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED" | "IGNORED";

// NO_ACCESS (TASK-064): a user who completed profile onboarding but hasn't chosen Trial/Pro/a
// promo code yet — distinct from EXPIRED_READ_ONLY (a user who genuinely HAD trial/paid/
// promotional access before and it lapsed). Never set directly; resolveProductAccess derives it
// from `everHadAccess` (see ResolveProductAccessInput) being false.
export type ProductAccessState = "NO_ACCESS" | "TRIAL" | "PRO" | "EXPIRED_READ_ONLY";

// Which mechanism produced the resolved PRO/TRIAL state — priority is
// PAID_SUBSCRIPTION > PROMOTION > TRIAL > NONE (docs/10.3-promotion-codes-pro-access.md).
// A promotional grant never changes `ProductAccessState` itself (PROMOTION still resolves to
// the "PRO" state) — this is separate metadata about *why*, used by callers that need to know a
// user's access is time-bounded by a promotion rather than a real subscription/trial.
export type ProductAccessSource = "PAID_SUBSCRIPTION" | "PROMOTION" | "TRIAL" | "NONE";

export type EffectiveSubscriptionSnapshot = {
  status: BillingSubscriptionStatus;
  currentPeriodEnd: Date | null;
};
