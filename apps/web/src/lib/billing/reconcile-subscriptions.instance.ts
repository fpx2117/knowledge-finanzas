import { createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { createMercadoPagoBillingProvider, createReconcileSubscriptions } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { subscriptionSynchronizer } from "./subscription-synchronizer.instance";

export const reconcileSubscriptions = createReconcileSubscriptions({
  subscriptions: createBillingSubscriptionRepository(db),
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  synchronizer: subscriptionSynchronizer,
});
