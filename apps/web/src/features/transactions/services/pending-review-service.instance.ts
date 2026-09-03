import { categoryMapRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";

import { createPendingReviewService } from "./pending-review-service";

export const pendingReviewService = createPendingReviewService({
  transactions: transactionRepository,
  categories: categoryRepository,
  categoryMap: categoryMapRepository,
});
