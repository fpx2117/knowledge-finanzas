export type StalePendingSubscription = { id: string; userId: string; createdAt: Date };
export type PastDueSubscription = { id: string; userId: string; currentPeriodEnd: Date | null };
export type FailedWebhookEvent = { id: string; eventType: string; externalResourceId: string | null; errorCode: string | null; receivedAt: Date };
export type PendingRefund = { id: string; paymentId: string; amount: string; currencyCode: string; requestedAt: Date };

export type ReconciliationQueue = {
  stalePendingSubscriptions: StalePendingSubscription[];
  pastDueSubscriptions: PastDueSubscription[];
  failedWebhooks: FailedWebhookEvent[];
  pendingRefunds: PendingRefund[];
};

export type ReconciliationQueueRepository = {
  subscriptions: {
    listStalePending(olderThan: Date): Promise<StalePendingSubscription[]>;
    listPastDue(): Promise<PastDueSubscription[]>;
  };
  webhookEvents: { listFailed(limit: number): Promise<FailedWebhookEvent[]> };
  refunds: { listPending(): Promise<PendingRefund[]> };
};

const STALE_PENDING_HOURS = 24;
const MS_PER_HOUR = 60 * 60 * 1000;
const WEBHOOK_LIMIT = 50;

// Pure query composition (Implementation Notes) — no provider/external call at query time,
// individual reconcile actions only, never a "reconcile everything" (task's Scope). A
// subscription stuck PENDING for more than a day almost certainly had its confirming webhook
// dropped or the checkout was abandoned.
export function createGetReconciliationQueue(dependencies: { repository: ReconciliationQueueRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function getReconciliationQueue(): Promise<ReconciliationQueue> {
    const staleCutoff = new Date(now().getTime() - STALE_PENDING_HOURS * MS_PER_HOUR);

    const [stalePendingSubscriptions, pastDueSubscriptions, failedWebhooks, pendingRefunds] = await Promise.all([
      dependencies.repository.subscriptions.listStalePending(staleCutoff),
      dependencies.repository.subscriptions.listPastDue(),
      dependencies.repository.webhookEvents.listFailed(WEBHOOK_LIMIT),
      dependencies.repository.refunds.listPending(),
    ]);

    return { stalePendingSubscriptions, pastDueSubscriptions, failedWebhooks, pendingRefunds };
  };
}
