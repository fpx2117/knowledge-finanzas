import { categoryMapRepository, categoryRepository, classificationRuleRepository, transactionRepository } from "@know-finanzas/db";

import { createClassificationRuleService } from "./classification-rule-service";

export const classificationRuleService = createClassificationRuleService({
  rules: classificationRuleRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  categoryMap: categoryMapRepository,
});
