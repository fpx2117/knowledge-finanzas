import {
  accountRepository,
  categoryMapRepository,
  categoryRepository,
  classificationRuleRepository,
  importBatchRepository,
  merchantRepository,
  merchantUserDefaultRepository,
  transactionRepository,
} from "@know-finanzas/db";

import { createTransactionService } from "@/features/transactions/services/transaction-service";
import { createImportService } from "./import-service";

const txnService = createTransactionService({
  accounts: accountRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  merchants: merchantRepository,
  categoryMap: categoryMapRepository,
  merchantDefaults: merchantUserDefaultRepository,
  classificationRules: classificationRuleRepository,
});

export const importService = createImportService({
  accounts: accountRepository,
  transactions: transactionRepository,
  importBatches: importBatchRepository,
  createTransaction: (userId, type, input, timezone) =>
    type === "INCOME"
      ? txnService.createIncomeTransaction(userId, input, timezone)
      : txnService.createExpenseTransaction(userId, input, timezone),
});
