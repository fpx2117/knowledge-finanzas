import type { AIProvider } from "../../provider";
import { buildMerchantNormalizationPrompt, MERCHANT_NORMALIZATION_PROMPT_VERSION, type MerchantNormalizationInput } from "./prompt";
import { merchantNormalizationSchema } from "./schema";

export type MerchantNormalizationSuggestion = { normalizedMerchant: string | null; confidence: number };

export const DEFAULT_MIN_CONFIDENCE = 0.5;

// A suggestion only — the raw description/merchant the user typed is never touched by this
// capability (docs task-037 acceptance: "Merchant normalization never removes or overwrites the
// original description"). Empty/whitespace-only or low-confidence output is treated as "no
// suggestion", not surfaced as a value to accept.
export async function normalizeMerchant(
  provider: AIProvider,
  input: MerchantNormalizationInput,
  options: { minConfidence?: number } = {},
): Promise<MerchantNormalizationSuggestion> {
  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;

  const result = await provider.generateStructured({
    role: "FAST",
    capability: "merchant.normalize",
    promptVersion: MERCHANT_NORMALIZATION_PROMPT_VERSION,
    prompt: buildMerchantNormalizationPrompt(input),
    schema: merchantNormalizationSchema,
    schemaName: "merchant_normalization_suggestion",
  });

  const trimmed = result.data.normalizedMerchant?.trim();
  if (!trimmed || result.data.confidence < minConfidence) return { normalizedMerchant: null, confidence: result.data.confidence };

  return { normalizedMerchant: trimmed, confidence: result.data.confidence };
}
