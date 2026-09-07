import type { NotificationCategory, NotificationPriority } from "@know-finanzas/notifications";

// Spec 13 §17.4 — the order the notification center shows things in. Security first, then
// financial risk/action, then billing that affects access, then reminders, then system, then
// product. Financial notifications never get mixed below marketing.
const CATEGORY_RANK: Record<NotificationCategory, number> = {
  SECURITY: 0,
  FINANCIAL: 1,
  BILLING: 2,
  ACCOUNT: 4,
  PRODUCT: 5,
};

const PRIORITY_BUMP: Record<NotificationPriority, number> = {
  CRITICAL: 0,
  HIGH: 0.25,
  NORMAL: 0.5,
  LOW: 0.75,
};

// Reminder-type events sit at rank 3 regardless of their category enum (they're FINANCIAL in the
// schema but conceptually "recordatorios" in the spec's ordering).
const REMINDER_TYPES = new Set(["DEBT_DUE_SOON", "SCHEDULED_TRANSACTION_DUE"]);

export function notificationRank(input: {
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
}): number {
  const base = REMINDER_TYPES.has(input.type) ? 3 : CATEGORY_RANK[input.category];
  return base + PRIORITY_BUMP[input.priority];
}
