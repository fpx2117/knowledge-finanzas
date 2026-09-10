export type BillingProviderCode = "MERCADO_PAGO";
export type BillingInterval = "MONTHLY";

export type BillingSubscriptionStatus = "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";
export type BillingPeriodStatus = "PENDING" | "ACTIVE" | "CLOSED" | "FAILED";
export type BillingPaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELLED";
export type BillingWebhookEventStatus = "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED" | "IGNORED";

// FREE: the permanent freemium tier — full core personal-finance read+write, a small monthly AI
// allowance (see limits.ts `freeAiCreditsPerPeriod`), no email/WhatsApp, no AI scenarios. This is
// what every authenticated user gets when no paid subscription / promotion / active trial applies
// (resolveProductAccess returns it for source === "NONE").
//
// EXPIRED_READ_ONLY is now a rare hard-lock state (admin action / future dunning rule), no longer
// the default post-trial landing. NO_ACCESS is legacy — kept for type/back-compat, no live emitter
// (the onboarding gate that would set it is not wired in apps/web).
export type ProductAccessState = "NO_ACCESS" | "FREE" | "TRIAL" | "PRO" | "EXPIRED_READ_ONLY";

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
