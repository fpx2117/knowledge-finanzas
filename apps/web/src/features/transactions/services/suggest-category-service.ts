import { categorizeTransaction, type AIProvider, type ExecuteAICapability, type TransactionCategorySuggestion } from "@know-finanzas/ai";

type CategoryRecord = { id: string; name: string };
type CategoryRepository = { listForUser(userId: string, options?: { type?: "INCOME" | "EXPENSE" }): Promise<CategoryRecord[]> };

export type SuggestTransactionCategoryInput = {
  transactionType: "INCOME" | "EXPENSE";
  description: string;
  merchant: string | null;
  operationId: string;
};

// SuggestTransactionCategory (docs/17-ai-categorization-slice.md §58-62): the server — never the
// client — loads the owned, active, type-compatible category list and turns it into candidate
// tokens. The model can only ever pick a token from that list, so a foreign/archived/wrong-type
// category is structurally impossible to select via model output.
export function createSuggestTransactionCategoryService(dependencies: {
  categories: CategoryRepository;
  provider: AIProvider;
  executeAICapability: ExecuteAICapability;
  minConfidence?: number;
}) {
  return {
    async suggestCategory(userId: string, input: SuggestTransactionCategoryInput): Promise<TransactionCategorySuggestion> {
      const categories = await dependencies.categories.listForUser(userId, { type: input.transactionType });
      const candidates = categories.map((category, index) => ({ token: `C${index + 1}`, id: category.id, name: category.name }));

      return dependencies.executeAICapability({
        userId,
        capability: "transaction.categorize",
        operationId: input.operationId,
        execute: () => categorizeTransaction(
          dependencies.provider,
          { transactionType: input.transactionType, description: input.description, merchant: input.merchant, candidates },
          { minConfidence: dependencies.minConfidence },
        ),
      });
    },
  };
}
