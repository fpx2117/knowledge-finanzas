import { createBillingRefundRepository, createBillingSubscriptionRepository, createBillingWebhookEventRepository, db } from "@know-finanzas/db";
import { createGetReconciliationQueue } from "@/features/admin/billing/services/get-reconciliation-queue";

export const getReconciliationQueue = createGetReconciliationQueue({
  repository: {
    subscriptions: createBillingSubscriptionRepository(db),
    webhookEvents: createBillingWebhookEventRepository(db),
    refunds: createBillingRefundRepository(db),
  },
});
