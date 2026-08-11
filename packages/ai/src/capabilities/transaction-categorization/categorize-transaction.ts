import { AIError } from "../../errors";
import type { AIProvider } from "../../provider";
import { buildTransactionCategorizationPrompt, TRANSACTION_CATEGORIZATION_PROMPT_VERSION, type CategoryCandidate, type TransactionCategorizationInput } from "./prompt";
import { transactionCategorizationSchema, type RawTransactionCategorization } from "./schema";

export type TransactionCategorySuggestion = { categoryId: string | null; confidence: number; reason?: string };

// docs/17-ai-categorization-slice.md §81-83: an initial UX heuristic, not calibrated
// probability — centralized here instead of scattered magic numbers.
export const DEFAULT_MIN_CONFIDENCE = 0.5;

export async function categorizeTransaction(
  provider: AIProvider,
  input: TransactionCategorizationInput,
  options: { minConfidence?: number } = {},
): Promise<TransactionCategorySuggestion> {
  const result = await provider.generateStructured({
    role: "FAST",
    capability: "transaction.categorize",
    promptVersion: TRANSACTION_CATEGORIZATION_PROMPT_VERSION,
    prompt: buildTransactionCategorizationPrompt(input),
    schema: transactionCategorizationSchema,
    schemaName: "transaction_category_suggestion",
  });

  return mapSuggestion(result.data, input.candidates, options.minConfidence ?? DEFAULT_MIN_CONFIDENCE);
}

// Structured-output validation guarantees shape, not that the token is one we actually offered
// (docs/17 §29-30, §56) — an unknown token is a domain violation, not a low-confidence result.
function mapSuggestion(raw: RawTransactionCategorization, candidates: CategoryCandidate[], minConfidence: number): TransactionCategorySuggestion {
  if (raw.candidate === null) return { categoryId: null, confidence: raw.confidence, reason: raw.reason };

  const match = candidates.find((candidate) => candidate.token === raw.candidate);
  if (!match) throw new AIError("AI_INVALID_OUTPUT", { field: "candidate" });

  if (raw.confidence < minConfidence) return { categoryId: null, confidence: raw.confidence, reason: raw.reason };

  return { categoryId: match.id, confidence: raw.confidence, reason: raw.reason };
}
