import type { BillingSubscriptionStatus } from "../domain/billing-types";
import { isEffectivePaidSubscription } from "../plans/resolver";

export type ExpirePastDueSubscriptionRecord = {
  id: string;
  userId: string;
  status: BillingSubscriptionStatus;
  currentPeriodEnd: Date | null;
};

export type ExpirePastDueSubscriptionsRepository = {
  // Unscoped by design: this runs as a system/cron process, not on behalf of one user.
  listPastDue(): Promise<ExpirePastDueSubscriptionRecord[]>;
  markExpiredIfPastDue(subscriptionId: string): Promise<{ id: string } | undefined>;
};

export type ExpirePastDueResult = { subscriptionId: string; userId: string; expired: boolean };

// Sweeps PAST_DUE subscriptions whose grace window (currentPeriodEnd + BILLING_GRACE_PERIOD_DAYS)
// has elapsed and marks them EXPIRED. This only writes back the terminal state that the access
// resolver (isEffectivePaidSubscription) already computes on every read — effective access loss
// happens the moment grace elapses regardless of whether/when this sweep runs; the write-back
// just keeps the stored status from drifting indefinitely and unblocks a fresh subscription
// (the active-subscription uniqueness constraint only excludes PENDING/ACTIVE/PAST_DUE).
export function createExpirePastDueSubscriptions(dependencies: { subscriptions: ExpirePastDueSubscriptionsRepository; now?: () => Date; graceDays: number }) {
  const now = dependencies.now ?? (() => new Date());

  return async function expirePastDueSubscriptions(): Promise<{ expired: number; results: ExpirePastDueResult[] }> {
    const candidates = await dependencies.subscriptions.listPastDue();
    const results: ExpirePastDueResult[] = [];

    for (const subscription of candidates) {
      const stillEffective = isEffectivePaidSubscription(subscription, now(), dependencies.graceDays);
      if (stillEffective) {
        results.push({ subscriptionId: subscription.id, userId: subscription.userId, expired: false });
        continue;
      }

      const updated = await dependencies.subscriptions.markExpiredIfPastDue(subscription.id);
      results.push({ subscriptionId: subscription.id, userId: subscription.userId, expired: Boolean(updated) });
    }

    return { expired: results.filter((result) => result.expired).length, results };
  };
}
