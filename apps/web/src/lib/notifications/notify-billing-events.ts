import { notifyUser } from "./notify";

// Billing lifecycle notifications are BILLING category — they bypass the FINANCIAL/PRODUCT
// access gate in notifyUser (docs/09-notifications-alerts.md: operational notifications must
// keep firing even once premium financial access has lapsed, e.g. telling an EXPIRED user their
// subscription just expired).

export function notifyPaymentFailed(input: { userId: string; userTimezone: string; subscriptionId: string }) {
  return notifyUser({
    userId: input.userId,
    userTimezone: input.userTimezone,
    intent: {
      type: "PAYMENT_FAILED",
      category: "BILLING",
      priority: "HIGH",
      titleKey: "PAYMENT_FAILED",
      bodyKey: "PAYMENT_FAILED",
      subjectType: "SUBSCRIPTION",
      subjectId: input.subscriptionId,
      occurredAt: new Date(),
      dedupKey: `PAYMENT_FAILED:${input.subscriptionId}:${new Date().toISOString().slice(0, 10)}`,
    },
  });
}

export function notifySubscriptionCancelled(input: { userId: string; userTimezone: string; subscriptionId: string }) {
  return notifyUser({
    userId: input.userId,
    userTimezone: input.userTimezone,
    intent: {
      type: "SUBSCRIPTION_CANCELLED",
      category: "BILLING",
      priority: "NORMAL",
      titleKey: "SUBSCRIPTION_CANCELLED",
      bodyKey: "SUBSCRIPTION_CANCELLED",
      subjectType: "SUBSCRIPTION",
      subjectId: input.subscriptionId,
      occurredAt: new Date(),
      dedupKey: `SUBSCRIPTION_CANCELLED:${input.subscriptionId}`,
    },
  });
}

export function notifySubscriptionExpired(input: { userId: string; userTimezone: string; subscriptionId: string }) {
  return notifyUser({
    userId: input.userId,
    userTimezone: input.userTimezone,
    intent: {
      type: "SUBSCRIPTION_EXPIRED",
      category: "BILLING",
      priority: "HIGH",
      titleKey: "SUBSCRIPTION_EXPIRED",
      bodyKey: "SUBSCRIPTION_EXPIRED",
      subjectType: "SUBSCRIPTION",
      subjectId: input.subscriptionId,
      occurredAt: new Date(),
      dedupKey: `SUBSCRIPTION_EXPIRED:${input.subscriptionId}`,
    },
  });
}

export function notifySubscriptionActivated(input: { userId: string; userTimezone: string; subscriptionId: string; periodStart: Date }) {
  return notifyUser({
    userId: input.userId,
    userTimezone: input.userTimezone,
    intent: {
      type: "SUBSCRIPTION_ACTIVATED",
      category: "BILLING",
      priority: "NORMAL",
      titleKey: "SUBSCRIPTION_ACTIVATED",
      bodyKey: "SUBSCRIPTION_ACTIVATED",
      subjectType: "SUBSCRIPTION",
      subjectId: input.subscriptionId,
      occurredAt: new Date(),
      // One notification per billing period, not one per redelivered webhook for the same period.
      dedupKey: `SUBSCRIPTION_ACTIVATED:${input.subscriptionId}:${input.periodStart.toISOString().slice(0, 10)}`,
    },
  });
}
