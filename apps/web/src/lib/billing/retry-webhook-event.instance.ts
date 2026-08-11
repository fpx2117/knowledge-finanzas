import { createBillingWebhookEventRepository, db } from "@know-finanzas/db";
import { createMercadoPagoBillingProvider, createRetryWebhookEvent } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { handlePaymentFailure } from "./handle-payment-failure.instance";
import { subscriptionSynchronizer } from "./subscription-synchronizer.instance";

export const retryWebhookEvent = createRetryWebhookEvent({
  events: createBillingWebhookEventRepository(db),
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  synchronizer: subscriptionSynchronizer,
  handlePaymentFailure,
});
