export type CategoryCandidate = { token: string; id: string; name: string };

export type TransactionCategorizationInput = {
  transactionType: "INCOME" | "EXPENSE";
  description: string;
  merchant: string | null;
  candidates: CategoryCandidate[];
};

export const TRANSACTION_CATEGORIZATION_PROMPT_VERSION = "v1";

// Minimum context only (docs/08-ai-openrouter.md implementation notes): type, description,
// merchant and the candidate category list — never balances, debts, email or full history.
export function buildTransactionCategorizationPrompt(input: TransactionCategorizationInput): string {
  const candidateLines = input.candidates.map((candidate) => `${candidate.token} = ${candidate.name}`).join("\n");

  return [
    "Suggest the best matching category for this transaction.",
    `Transaction type: ${input.transactionType}`,
    `Description: ${input.description}`,
    input.merchant ? `Merchant: ${input.merchant}` : undefined,
    "",
    "Candidate categories (respond with the token, or null if none clearly fit):",
    candidateLines || "(none available)",
  ].filter((line): line is string => line !== undefined).join("\n");
}
