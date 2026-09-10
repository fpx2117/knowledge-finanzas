import { createBillingSubscriptionRepository, createUserRepository, db } from "@know-finanzas/db";
import { createExpirePastDueSubscriptions } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { notifySubscriptionExpired } from "@/lib/notifications/notify-billing-events";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";

const users = createUserRepository(db);
const baseExpirePastDueSubscriptions = createExpirePastDueSubscriptions({
  subscriptions: createBillingSubscriptionRepository(db),
  graceDays: env.BILLING_GRACE_PERIOD_DAYS,
});

// Not yet wired to a scheduler (TASK-039/TASK-041 own the cron/worker infrastructure); exposed
// here so a future scheduled trigger only has to call this instance, not re-wire dependencies.
// The notification side effect is already wired so nothing else needs to change once a real
// trigger calls this.
export async function expirePastDueSubscriptions() {
  const result = await baseExpirePastDueSubscriptions();
  await Promise.all(result.results
    .filter((item) => item.expired)
    .map(async (item) => {
      const timezone = await users.findTimezoneById(item.userId);
      await notifySubscriptionExpired({ userId: item.userId, userTimezone: timezone ?? "UTC", subscriptionId: item.subscriptionId });

      const email = await users.findEmailById(item.userId);
      const internal = email ? isInternalAccount(email) : false;
      await analyticsService(
        "subscription_expired",
        {},
        { eventId: `subscription_expired:${item.subscriptionId}`, userId: item.userId, internal },
      );
      // A lapsed subscription drops the user to the permanent FREE tier (no longer read-only).
      await analyticsService(
        "product_access_changed",
        { from: "PRO", to: "FREE", source: "NONE", reason: "subscription_expired" },
        { eventId: `product_access_changed:free:${item.subscriptionId}`, userId: item.userId, internal },
      );
    }));
  return result;
}
