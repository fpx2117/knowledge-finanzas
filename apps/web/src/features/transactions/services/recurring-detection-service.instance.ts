import { categoryRepository, recurringSeriesRepository, transactionRepository } from "@know-finanzas/db";

import { createRecurringDetectionService } from "./recurring-detection-service";

export const recurringDetectionService = createRecurringDetectionService({
  transactions: transactionRepository,
  recurringSeries: recurringSeriesRepository,
  categories: categoryRepository,
});
