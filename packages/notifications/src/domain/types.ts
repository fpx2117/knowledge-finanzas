// Mirrors packages/db/src/schema.ts's notification enums as plain domain types, decoupled from
// Drizzle — application logic here never imports @know-finanzas/db directly (docs/09-notifications-alerts.md).

export type NotificationCategory = "FINANCIAL" | "BILLING" | "SECURITY" | "ACCOUNT" | "PRODUCT";

export type NotificationType =
  | "DEBT_DUE_SOON" | "DEBT_OVERDUE" | "SCHEDULED_TRANSACTION_DUE" | "BUDGET_NEAR_LIMIT" | "BUDGET_EXCEEDED"
  | "CASHFLOW_LOW" | "CASHFLOW_NEGATIVE" | "WEEKLY_FINANCIAL_SUMMARY" | "MONTHLY_FINANCIAL_SUMMARY"
  | "SUBSCRIPTION_ACTIVATED" | "PAYMENT_FAILED" | "GRACE_PERIOD_STARTED" | "SUBSCRIPTION_CANCELLED" | "SUBSCRIPTION_EXPIRED"
  | "NEW_LOGIN" | "PASSWORD_CHANGED" | "EMAIL_CHANGED" | "SECURITY_SETTING_CHANGED"
  | "TRIAL_STARTED" | "TRIAL_ENDING" | "TRIAL_EXPIRED" | "ACCOUNT_EXPORT_READY" | "ACCOUNT_DELETION_REQUESTED"
  | "AI_CREDITS_LOW" | "PROMOTION_STARTED" | "PROMOTION_ENDING" | "PROMOTION_EXPIRED"
  | "REFERRAL_SIGNUP" | "REFERRAL_REWARD_GRANTED";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

// Schema calls the realtime channel "REALTIME" (docs/09-notifications-alerts.md calls it
// REALTIME_WEB) — kept as the schema's literal name here to avoid a parallel vocabulary.
export type NotificationChannel = "IN_APP" | "REALTIME" | "EMAIL" | "WHATSAPP";

export type NotificationDeliveryStatus = "PENDING" | "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "FAILED" | "CANCELLED";

export type NotificationSubjectType = "DEBT" | "SCHEDULED_TRANSACTION" | "BUDGET" | "TRANSACTION" | "SUBSCRIPTION" | "NONE";

// The event a domain/application layer hands to the notification pipeline (docs/09 §16). This is
// intent, not persistence: whether it actually becomes a stored notification is decided by
// dedup + preference resolution downstream, never assumed by the caller.
export type NotificationIntent = {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  titleKey: string;
  bodyKey: string;
  subjectType?: NotificationSubjectType;
  subjectId?: string | null;
  metadata?: unknown;
  occurredAt: Date;
  scheduledFor?: Date | null;
  dedupKey?: string | null;
};

// Category-to-channel-set decision contract (docs/09 §15): "should this notification exist, on
// which channels, at what priority" — never sends anything itself. TASK-047 owns only this
// contract shape; concrete per-event rules (e.g. "debt due in N days") are TASK-049's job.
export type NotificationRuleEngine = {
  evaluate(input: { intent: NotificationIntent; eligibleChannels: NotificationChannel[] }): { shouldCreate: boolean; channels: NotificationChannel[]; priority: NotificationPriority };
};
