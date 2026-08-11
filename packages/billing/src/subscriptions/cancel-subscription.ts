import { BillingError } from "../errors";
import type { BillingSubscriptionStatus } from "../domain/billing-types";
import type { BillingProvider } from "../providers/billing-provider";
import type { createSubscriptionSynchronizer, SubscriptionRecord } from "./synchronize-subscription";

const NOT_CANCELLABLE_STATUSES: ReadonlySet<BillingSubscriptionStatus> = new Set(["CANCELLED", "EXPIRED"]);

export type CancellationReason = { reasonCode: string | null; reasonComment: string | null };

export type CancelSubscriptionRepository = {
  findByIdForUser(subscriptionId: string, userId: string): Promise<SubscriptionRecord | undefined>;
  // Local-only cancel for a subscription that never reached the provider (e.g. cancelled before
  // checkout completed) — there is nothing to call cancelSubscription on.
  cancelWithoutProvider(subscriptionId: string, reason?: CancellationReason): Promise<SubscriptionRecord | undefined>;
  // Optional, skippable feedback (docs/10-6.subscription-cancellation-refunds.md §82), recorded
  // separately from provider/status state and never blocking cancellation on failure.
  recordCancellationReason(subscriptionId: string, reason: CancellationReason): Promise<unknown>;
};

// User-triggered, ownership-scoped cancellation (docs/10-billing-subscriptions-mercadopago.md
// §45-46): cancels immediately at the provider — Mercado Pago's preapproval API has no scheduled
// cancellation — then reuses the subscription synchronizer so the resulting snapshot updates
// status/period the exact same way a webhook delivery would.
export function createCancelSubscription(dependencies: {
  subscriptions: CancelSubscriptionRepository;
  provider: Pick<BillingProvider, "cancelSubscription">;
  synchronizer: Pick<ReturnType<typeof createSubscriptionSynchronizer>, "synchronizeSubscription">;
}) {
  return async function cancelSubscription(input: { userId: string; subscriptionId: string; reason?: CancellationReason }) {
    const subscription = await dependencies.subscriptions.findByIdForUser(input.subscriptionId, input.userId);
    if (!subscription) throw new BillingError("BILLING_SUBSCRIPTION_NOT_FOUND");
    if (NOT_CANCELLABLE_STATUSES.has(subscription.status)) throw new BillingError("BILLING_SUBSCRIPTION_ALREADY_CANCELLED");

    if (!subscription.providerSubscriptionId) {
      const updated = await dependencies.subscriptions.cancelWithoutProvider(subscription.id, input.reason);
      if (!updated) throw new BillingError("BILLING_SUBSCRIPTION_NOT_FOUND");
      return { subscription: updated, period: null, periodCreated: false };
    }

    const snapshot = await dependencies.provider.cancelSubscription(subscription.providerSubscriptionId);
    const result = await dependencies.synchronizer.synchronizeSubscription(snapshot);
    if (input.reason) await dependencies.subscriptions.recordCancellationReason(subscription.id, input.reason);
    return result;
  };
}
