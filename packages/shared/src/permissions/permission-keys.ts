// One key per sensitive application service, verified server-side on every invocation
// (docs/21-commercial-admin.md) — UI hiding never substitutes for this check.
export const PERMISSION_KEYS = [
  "commercial.users.read",
  "commercial.audit.read",
  "billing.manage",
  "billing.refund.execute",
  "billing.webhook.replay",
  "promotions.manage",
  "ai.adjust",
  "notifications.manage",
  "referrals.invalidate",
  "commercial.metrics.read",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
