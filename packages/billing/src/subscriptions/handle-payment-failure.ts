export type HandlePaymentFailureRepository = {
  markPastDueIfActive(subscriptionId: string): Promise<{ id: string; userId: string; status: string } | undefined>;
};

// A failed renewal payment optimistically moves an ACTIVE subscription to PAST_DUE so effective
// access degrades to the grace-period rule immediately, without waiting for a separate provider
// subscription-status webhook. Idempotent: a subscription that is already PAST_DUE (or any
// terminal/non-ACTIVE state) is left untouched — this never overrides provider truth once it
// arrives via the subscription webhook or a reconcile pass.
export function createHandlePaymentFailure(dependencies: { subscriptions: HandlePaymentFailureRepository }) {
  return async function handlePaymentFailure(subscriptionId: string) {
    const subscription = await dependencies.subscriptions.markPastDueIfActive(subscriptionId);
    return { transitioned: Boolean(subscription), subscription: subscription ?? null };
  };
}
