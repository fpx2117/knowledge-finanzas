import { isBillingError } from "../errors";
import type { BillingProvider } from "../providers/billing-provider";
import type { createSubscriptionSynchronizer, SubscriptionRecord } from "./synchronize-subscription";

export type ReconcileSubscriptionsRepository = {
  // Unscoped by design: this runs as a system/cron job, not on behalf of a single user.
  listReconcilable(): Promise<SubscriptionRecord[]>;
};

export type ReconcileSubscriptionResult =
  | { subscriptionId: string; ok: true; status: SubscriptionRecord["status"] }
  | { subscriptionId: string; ok: false; errorCode: string };

// Recovers from missed/dropped webhook deliveries: pulls the provider's current state for every
// PENDING/ACTIVE/PAST_DUE subscription and replays it through the same synchronizer a webhook
// would use. One subscription's failure never aborts the batch — each is isolated and reported.
export function createReconcileSubscriptions(dependencies: {
  subscriptions: ReconcileSubscriptionsRepository;
  provider: Pick<BillingProvider, "getSubscription">;
  synchronizer: Pick<ReturnType<typeof createSubscriptionSynchronizer>, "synchronizeSubscription">;
}) {
  return async function reconcileSubscriptions(): Promise<{ reconciled: number; failed: number; results: ReconcileSubscriptionResult[] }> {
    const candidates = await dependencies.subscriptions.listReconcilable();
    const results: ReconcileSubscriptionResult[] = [];

    for (const subscription of candidates) {
      if (!subscription.providerSubscriptionId) continue;

      try {
        const snapshot = await dependencies.provider.getSubscription(subscription.providerSubscriptionId);
        const result = await dependencies.synchronizer.synchronizeSubscription(snapshot);
        results.push({ subscriptionId: subscription.id, ok: true, status: result.subscription.status });
      } catch (error) {
        results.push({ subscriptionId: subscription.id, ok: false, errorCode: isBillingError(error) ? error.code : "BILLING_RECONCILIATION_FAILED" });
      }
    }

    return { reconciled: results.filter((result) => result.ok).length, failed: results.filter((result) => !result.ok).length, results };
  };
}
