import { categoryRepository, subscriptionRepository, transactionRepository } from "@know-finanzas/db";

import { createSubscriptionDetectionService } from "./subscription-detection-service";

export const subscriptionDetectionService = createSubscriptionDetectionService({
  transactions: transactionRepository,
  subscriptions: subscriptionRepository,
  categories: categoryRepository,
});
