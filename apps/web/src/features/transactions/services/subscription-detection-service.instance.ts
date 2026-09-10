import { categoryRepository, merchantRepository, subscriptionRepository, transactionRepository } from "@know-finanzas/db";

import { createSubscriptionDetectionService } from "./subscription-detection-service";

export const subscriptionDetectionService = createSubscriptionDetectionService({
  transactions: transactionRepository,
  subscriptions: subscriptionRepository,
  categories: categoryRepository,
  merchants: merchantRepository,
});
