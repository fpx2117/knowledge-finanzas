import { createBillingPlanRepository, createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { createMercadoPagoBillingProvider } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";

import { createBillingService } from "@/features/billing/services/billing-service";

// Shared instance so both /settings/plan's "Suscribirse a Pro" and /elegir-acceso's "Comenzar
// con Pro" call the exact same StartProSubscription wiring — never a second, parallel one.
export const billingService = createBillingService({
  plans: createBillingPlanRepository(db),
  subscriptions: createBillingSubscriptionRepository(db),
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  backUrl: `${env.BETTER_AUTH_URL}/billing/return`,
  billingEnabled: env.BILLING_ENABLED && env.BILLING_NEW_SUBSCRIPTIONS_ENABLED,
});
