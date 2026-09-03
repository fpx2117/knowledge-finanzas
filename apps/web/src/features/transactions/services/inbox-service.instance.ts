import { categoryMapRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";

import { recurringDetectionService } from "./recurring-detection-service.instance";
import { subscriptionDetectionService } from "./subscription-detection-service.instance";
import { duplicateReviewService } from "./duplicate-review-service.instance";
import { createInboxService } from "./inbox-service";

export const inboxService = createInboxService({
  transactions: transactionRepository,
  categories: categoryRepository,
  categoryMap: categoryMapRepository,
  recurring: recurringDetectionService,
  subscriptions: subscriptionDetectionService,
  duplicates: duplicateReviewService,
});
