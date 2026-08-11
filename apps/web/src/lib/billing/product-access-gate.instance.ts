import { createBillingSubscriptionRepository, createPromotionRepository, createUserRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

import { createProductAccessGate } from "./product-access-gate";

// Real, production-wired gate used by server actions/services outside of tests. Kept in its own
// module (separate from product-access-gate.ts) so importing the pure gate factory/types never
// pulls in the real db client or env validation — unit tests only need the former.
export const productAccessGate = createProductAccessGate({
  users: createUserRepository(db),
  subscriptions: createBillingSubscriptionRepository(db),
  promotions: createPromotionRepository(db),
  graceDays: env.BILLING_GRACE_PERIOD_DAYS,
});
