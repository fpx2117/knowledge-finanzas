import { categoryRepository, classificationRuleRepository } from "@know-finanzas/db";

import { createClassificationRuleService } from "./classification-rule-service";

export const classificationRuleService = createClassificationRuleService({
  rules: classificationRuleRepository,
  categories: categoryRepository,
});
