"use server";

import { randomUUID } from "node:crypto";

import { AIError } from "@know-finanzas/ai";
import { categoryRepository } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { aiProvider } from "@/lib/ai/openrouter-provider.instance";
import { executeAICapability } from "@/lib/ai/execute-ai-capability.instance";
import { mapAIActionErrorToUi } from "@/lib/ai/map-ai-error";
import { createSuggestTransactionCategoryService } from "../services/suggest-category-service";

const service = createSuggestTransactionCategoryService({
  categories: categoryRepository,
  provider: aiProvider,
  executeAICapability,
});

export type SuggestCategoryResult =
  | { ok: true; categoryId: string | null; confidence: number }
  | { ok: false; error: ReturnType<typeof mapAIActionErrorToUi> };

export async function suggestTransactionCategoryAction(input: { transactionType: "INCOME" | "EXPENSE"; description: string; merchant: string | null }): Promise<SuggestCategoryResult> {
  try {
    if (!env.AI_CATEGORIZATION_ENABLED) throw new AIError("AI_DISABLED");
    if (!input.description.trim()) throw new AIError("AI_INVALID_OUTPUT", { field: "description" });

    const user = await requireCurrentUser();
    const suggestion = await service.suggestCategory(user.id, {
      transactionType: input.transactionType,
      description: input.description,
      merchant: input.merchant,
      operationId: randomUUID(),
    });

    return { ok: true, categoryId: suggestion.categoryId, confidence: suggestion.confidence };
  } catch (error) {
    return { ok: false, error: mapAIActionErrorToUi(error) };
  }
}
