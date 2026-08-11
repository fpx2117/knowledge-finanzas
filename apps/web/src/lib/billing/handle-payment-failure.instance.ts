import { createBillingSubscriptionRepository, createUserRepository, db } from "@know-finanzas/db";
import { createHandlePaymentFailure } from "@know-finanzas/billing";
import { notifyPaymentFailed } from "@/lib/notifications/notify-billing-events";

const users = createUserRepository(db);
const baseHandlePaymentFailure = createHandlePaymentFailure({
  subscriptions: createBillingSubscriptionRepository(db),
});

// Wrapped once here (rather than inside packages/billing) so the pure ACTIVE->PAST_DUE
// transition stays decoupled from @know-finanzas/notifications; every caller of this instance
// (currently just the webhook route) gets the notification side effect for free.
export async function handlePaymentFailure(subscriptionId: string) {
  const result = await baseHandlePaymentFailure(subscriptionId);
  if (result.transitioned && result.subscription) {
    const timezone = await users.findTimezoneById(result.subscription.userId);
    await notifyPaymentFailed({ userId: result.subscription.userId, userTimezone: timezone ?? "UTC", subscriptionId: result.subscription.id });
  }
  return result;
}
