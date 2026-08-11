// Mirrors packages/notifications' domain/types.ts split (plain types, no vendor coupling) — the
// rest of the codebase only ever imports these plus AnalyticsService.track(), never a vendor SDK.

export type AnalyticsEnvironment = "development" | "test" | "production";

// Single source of truth for the MVP event set — both the compile-time AnalyticsEventName union
// AND the runtime array registry.ts/its exhaustiveness test iterate over are derived from this
// one list, so they can never drift apart.
export const ANALYTICS_EVENT_NAMES = [
  "user_signed_up", "trial_started", "account_created", "transaction_created",
  "user_activated", "dashboard_viewed", "cashflow_viewed",
  "checkout_started", "subscription_activated", "trial_expired", "subscription_cancelled",
  "subscription_expired", "user_reactivated",
  "ai_capability_executed", "ai_credits_exhausted",
  "notification_action_clicked",
  "promotion_redeemed", "discount_applied",
  "referral_attributed", "referral_converted",
  "product_access_changed",
  "onboarding_started", "onboarding_step_viewed", "onboarding_step_completed", "onboarding_step_skipped", "onboarding_completed",
  "access_selection_viewed", "trial_selected", "pro_selected", "promotion_code_entered", "access_activated",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

// Every event carries this envelope; `properties` is the event-specific, schema-validated
// payload (see registry.ts). `eventId` is required for critical events (Error Cases: "missing
// event_id on a critical event") — it's what makes AnalyticsService.track() safe to call more
// than once for the same real-world occurrence (retried webhook, duplicate submit, etc).
export type AnalyticsEvent = {
  eventName: AnalyticsEventName;
  eventVersion: number;
  eventId: string | null;
  userId: string | null;
  occurredAt: Date;
  environment: AnalyticsEnvironment;
  internal: boolean;
  properties: unknown;
};

export type TrackResult =
  | { recorded: true; deduplicated: false }
  | { recorded: false; deduplicated: true }
  | { recorded: false; deduplicated: false; reason: "EVENT_NOT_REGISTERED" | "SCHEMA_INVALID" | "EVENT_ID_REQUIRED" | "PROVIDER_ERROR" };
