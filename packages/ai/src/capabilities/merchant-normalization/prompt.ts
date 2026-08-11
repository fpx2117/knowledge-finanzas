export type MerchantNormalizationInput = { description: string; rawMerchant: string | null };

export const MERCHANT_NORMALIZATION_PROMPT_VERSION = "v1";

export function buildMerchantNormalizationPrompt(input: MerchantNormalizationInput): string {
  return [
    "Suggest a clean, human-readable merchant name for this transaction. Respond with null if you cannot confidently improve on the raw value.",
    `Transaction description: ${input.description}`,
    input.rawMerchant ? `Raw merchant value: ${input.rawMerchant}` : "Raw merchant value: (none provided)",
  ].join("\n");
}
