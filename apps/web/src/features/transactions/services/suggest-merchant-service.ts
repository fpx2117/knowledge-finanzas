import { normalizeMerchant, type AIProvider, type ExecuteAICapability, type MerchantNormalizationSuggestion } from "@know-finanzas/ai";

export type SuggestMerchantInput = {
  description: string;
  rawMerchant: string | null;
  operationId: string;
};

// SuggestMerchantNormalization: the raw description/merchant the user typed is never sent for
// mutation, only read — this capability only ever returns a suggestion, and the caller decides
// whether to apply it (docs task-037 acceptance: raw description is never removed/overwritten).
export function createSuggestMerchantService(dependencies: {
  provider: AIProvider;
  executeAICapability: ExecuteAICapability;
  minConfidence?: number;
}) {
  return {
    async suggestMerchant(userId: string, input: SuggestMerchantInput): Promise<MerchantNormalizationSuggestion> {
      return dependencies.executeAICapability({
        userId,
        capability: "merchant.normalize",
        operationId: input.operationId,
        execute: () => normalizeMerchant(
          dependencies.provider,
          { description: input.description, rawMerchant: input.rawMerchant },
          { minConfidence: dependencies.minConfidence },
        ),
      });
    },
  };
}
