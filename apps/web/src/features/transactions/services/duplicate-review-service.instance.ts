import { duplicateDismissalRepository, transactionRepository } from "@know-finanzas/db";

import { createDuplicateReviewService } from "./duplicate-review-service";

export const duplicateReviewService = createDuplicateReviewService({
  transactions: transactionRepository,
  dismissals: duplicateDismissalRepository,
});
