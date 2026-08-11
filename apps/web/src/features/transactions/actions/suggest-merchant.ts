"use server";

import { randomUUID } from "node:crypto";

import { AIError } from "@know-finanzas/ai";
import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { aiProvider } from "@/lib/ai/openrouter-provider.instance";
import { executeAICapability } from "@/lib/ai/execute-ai-capability.instance";
import { mapAIActionErrorToUi } from "@/lib/ai/map-ai-error";
import { createSuggestMerchantService } from "../services/suggest-merchant-service";

const service = createSuggestMerchantService({ provider: aiProvider, executeAICapability });

export type SuggestMerchantResult =
  | { ok: true; normalizedMerchant: string | null; confidence: number }
  | { ok: false; error: ReturnType<typeof mapAIActionErrorToUi> };

export async function suggestMerchantAction(input: { description: string; rawMerchant: string | null }): Promise<SuggestMerchantResult> {
  try {
    if (!env.AI_CATEGORIZATION_ENABLED) throw new AIError("AI_DISABLED");
    if (!input.description.trim()) throw new AIError("AI_INVALID_OUTPUT", { field: "description" });

    const user = await requireCurrentUser();
    const suggestion = await service.suggestMerchant(user.id, {
      description: input.description,
      rawMerchant: input.rawMerchant,
      operationId: randomUUID(),
    });

    return { ok: true, normalizedMerchant: suggestion.normalizedMerchant, confidence: suggestion.confidence };
  } catch (error) {
    return { ok: false, error: mapAIActionErrorToUi(error) };
  }
}
