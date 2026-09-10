export * from "./schema";
export * from "./client";
export { isUniqueViolation } from "./pg-errors";
export * from "./taxonomy/category-taxonomy";
export * from "./merchants/normalize";
export { MERCHANT_SEED, type MerchantSeed } from "./merchants/merchant-seed";
export * from "./application-client";
export * from "./queries";
export * from "./repositories";
export * from "./audit/finance-audit";

import { db } from "./application-client";
import {
  createAccountRepository,
  createBudgetAlertRepository,
  createBudgetRepository,
  createCategoryRepository,
  createCategoryMapRepository,
  createCategoryTaxonomyRepository,
  createClassificationRuleRepository,
  createGoalRepository,
  createGoalAllocationRepository,
  createInsightRepository,
  createMerchantRepository,
  createMerchantUserDefaultRepository,
  createQuickTemplateRepository,
  createDuplicateDismissalRepository,
  createImportBatchRepository,
  createRecurringSeriesRepository,
  createSubscriptionRepository,
  createTransactionRepository,
  createUserPreferencesRepository,
  createFxRateRepository,
  createKaiInteractionRepository,
  createKaiNotificationRepository,
} from "./repositories";

export const accountRepository = createAccountRepository(db);
export const categoryRepository = createCategoryRepository(db);
export const categoryTaxonomyRepository = createCategoryTaxonomyRepository(db);
export const categoryMapRepository = createCategoryMapRepository(db);
export const merchantRepository = createMerchantRepository(db);
export const merchantUserDefaultRepository = createMerchantUserDefaultRepository(db);
export const classificationRuleRepository = createClassificationRuleRepository(db);
export const quickTemplateRepository = createQuickTemplateRepository(db);
export const transactionRepository = createTransactionRepository(db);
export const recurringSeriesRepository = createRecurringSeriesRepository(db);
export const subscriptionRepository = createSubscriptionRepository(db);
export const duplicateDismissalRepository = createDuplicateDismissalRepository(db);
export const importBatchRepository = createImportBatchRepository(db);
export const budgetRepository = createBudgetRepository(db);
export const budgetAlertRepository = createBudgetAlertRepository(db);
export const goalRepository = createGoalRepository(db);
export const goalAllocationRepository = createGoalAllocationRepository(db);
export const insightRepository = createInsightRepository(db);
export const userPreferencesRepository = createUserPreferencesRepository(db);
export const fxRateRepository = createFxRateRepository(db);
export const kaiInteractionRepository = createKaiInteractionRepository(db);
export const kaiNotificationRepository = createKaiNotificationRepository(db);
