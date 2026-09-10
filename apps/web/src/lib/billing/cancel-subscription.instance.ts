import { createCancelSubscription, createMercadoPagoBillingProvider } from "@know-finanzas/billing";
import { createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

import { subscriptionSynchronizer } from "./subscription-synchronizer.instance";

// User-triggered cancellation, ownership-scoped. Reuses the shared synchronizer so the resulting
// snapshot updates status/period exactly as a webhook delivery would.
export const cancelSubscription = createCancelSubscription({
  subscriptions: createBillingSubscriptionRepository(db),
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  synchronizer: subscriptionSynchronizer,
});
