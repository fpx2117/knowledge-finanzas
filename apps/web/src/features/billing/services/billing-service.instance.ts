import { createMercadoPagoBillingProvider } from "@know-finanzas/billing";
import { createBillingPlanRepository, createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

import { createBillingService } from "./billing-service";

const plans = createBillingPlanRepository(db);
const subscriptionsRepo = createBillingSubscriptionRepository(db);

// Real, production-wired startSubscription. Kept in its own instance module so the pure factory
// stays free of the db client and provider SDK.
export const billingService = createBillingService({
  plans: {
    findActiveByCode: (code) => plans.findActiveByCode(code),
  },
  subscriptions: {
    create: ({ userId, planId, status }) =>
      subscriptionsRepo.create({
        userId,
        planId,
        provider: "MERCADO_PAGO",
        providerSubscriptionId: null,
        status,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      }),
    findEffectiveForUser: (userId) => subscriptionsRepo.findEffectiveForUser(userId),
    attachProviderReference: (id, input) => subscriptionsRepo.attachProviderReference(id, input),
    markFailed: (id) => subscriptionsRepo.markFailed(id),
  },
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  backUrl: `${env.BETTER_AUTH_URL}/app/billing/return`,
  billingEnabled: env.BILLING_ENABLED && env.BILLING_NEW_SUBSCRIPTIONS_ENABLED,
});
