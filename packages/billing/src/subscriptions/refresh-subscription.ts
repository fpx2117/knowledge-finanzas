import { BillingError } from "../errors";
import type { BillingProvider } from "../providers/billing-provider";
import type { createSubscriptionSynchronizer, SubscriptionRecord } from "./synchronize-subscription";

export type RefreshSubscriptionRepository = {
  findByIdForUser(subscriptionId: string, userId: string): Promise<(SubscriptionRecord & { updatedAt: Date }) | undefined>;
};

// User-triggered manual refresh, ownership-scoped. Rate limited per subscription (not globally)
// using the row's own updatedAt as the cooldown clock — no extra state needed, and every
// synchronizeSubscription call touches updatedAt, so a successful refresh naturally resets it.
export function createRefreshSubscriptionFromProvider(dependencies: {
  subscriptions: RefreshSubscriptionRepository;
  provider: Pick<BillingProvider, "getSubscription">;
  synchronizer: Pick<ReturnType<typeof createSubscriptionSynchronizer>, "synchronizeSubscription">;
  cooldownMs?: number;
  now?: () => Date;
}) {
  const cooldownMs = dependencies.cooldownMs ?? 30_000;
  const now = dependencies.now ?? (() => new Date());

  return async function refreshSubscriptionFromProvider(input: { userId: string; subscriptionId: string }) {
    const subscription = await dependencies.subscriptions.findByIdForUser(input.subscriptionId, input.userId);
    if (!subscription) throw new BillingError("BILLING_SUBSCRIPTION_NOT_FOUND");

    if (now().getTime() - subscription.updatedAt.getTime() < cooldownMs) {
      throw new BillingError("BILLING_REFRESH_RATE_LIMITED");
    }

    // A subscription that never reached the provider (crashed right after the local row was
    // created) has nothing to refresh from yet — report the current state as-is.
    if (!subscription.providerSubscriptionId) {
      return { subscription, period: null, periodCreated: false };
    }

    const snapshot = await dependencies.provider.getSubscription(subscription.providerSubscriptionId);
    return dependencies.synchronizer.synchronizeSubscription(snapshot);
  };
}
