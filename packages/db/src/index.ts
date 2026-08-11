export * from "./schema";
export * from "./client";
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
  createTransactionRepository,
} from "./repositories";

export const accountRepository = createAccountRepository(db);
export const categoryRepository = createCategoryRepository(db);
export const transactionRepository = createTransactionRepository(db);
export const budgetRepository = createBudgetRepository(db);
export const budgetAlertRepository = createBudgetAlertRepository(db);
