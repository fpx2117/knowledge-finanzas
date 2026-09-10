import {
  createAICreditRepository,
  createBillingPaymentRepository,
  createBillingPeriodRepository,
  createBillingSubscriptionRepository,
  createUserRepository,
  db,
} from "@know-finanzas/db";
import { createSubscriptionSynchronizer } from "@know-finanzas/billing";
import { createGrantProPeriodCredits } from "@know-finanzas/ai";
import { env } from "@know-finanzas/config";
import { notifySubscriptionActivated } from "@/lib/notifications/notify-billing-events";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";

const users = createUserRepository(db);
const subscriptionsForLookup = createBillingSubscriptionRepository(db);

const ACCESS_ENUM = new Set(["NO_ACCESS", "FREE", "TRIAL", "PRO", "EXPIRED_READ_ONLY"]);

// Shared real-repository synchronizer: the webhook route, manual refresh, cancellation and
// reconciliation all need the exact same period/grant side effects a webhook delivery would
// produce, so they all replay through this one instance rather than duplicating wiring.
const baseSynchronizer = createSubscriptionSynchronizer({
  subscriptions: createBillingSubscriptionRepository(db),
  periods: createBillingPeriodRepository(db),
  payments: createBillingPaymentRepository(db),
  grantProPeriodCredits: createGrantProPeriodCredits(createAICreditRepository(db), env.PRO_AI_CREDITS_PER_PERIOD),
});

export const subscriptionSynchronizer = {
  ...baseSynchronizer,
  async synchronizeSubscription(...args: Parameters<typeof baseSynchronizer.synchronizeSubscription>) {
    // Capture the pre-sync access state so a first-time activation can emit the FREE/TRIAL → PRO
    // transition for the conversion funnel. Best-effort — a failure here never blocks the sync.
    const priorAccess = await subscriptionsForLookup
      .findByProviderSubscriptionId(args[0].providerSubscriptionId)
      .then((row) => (row ? productAccessGate.getAccessState(row.userId) : null))
      .catch(() => null);

    const result = await baseSynchronizer.synchronizeSubscription(...args);
    // periodCreated is only true the first time a given (subscriptionId, periodStart) pair is
    // seen — every consumer of this instance (webhook/refresh/cancel/reconcile) gets the
    // notification for free, exactly once per real period, regardless of which path triggered it.
    if (result.periodCreated && result.period) {
      const timezone = await users.findTimezoneById(result.subscription.userId);
      await notifySubscriptionActivated({ userId: result.subscription.userId, userTimezone: timezone ?? "UTC", subscriptionId: result.subscription.id, periodStart: result.period.startsAt });

      const email = await users.findEmailById(result.subscription.userId);
      const internal = email ? isInternalAccount(email) : false;
      await analyticsService(
        "subscription_activated",
        { planCode: null },
        { eventId: `subscription_activated:${result.subscription.id}:${result.period.startsAt.toISOString()}`, userId: result.subscription.userId, internal },
      );

      const from = priorAccess && ACCESS_ENUM.has(priorAccess) && priorAccess !== "PRO" ? priorAccess : "FREE";
      await analyticsService(
        "product_access_changed",
        { from: from as "NO_ACCESS" | "FREE" | "TRIAL" | "EXPIRED_READ_ONLY", to: "PRO", source: "PAID_SUBSCRIPTION", reason: "subscription_activated" },
        { eventId: `product_access_changed:pro:${result.subscription.id}:${result.period.startsAt.toISOString()}`, userId: result.subscription.userId, internal },
      );
    }
    return result;
  },
};
