// Stable capability identifiers (docs/08.1-ai-credits-and-usage.md §18).
export const AI_CAPABILITIES = [
  "transaction.categorize",
  "capture.parse",
  "merchant.normalize",
  "assistant.query.simple",
  "assistant.query.complex",
  "cashflow.explain",
  "budget.explain",
  "debt.explain",
  "action.prepare",
  "scenario.simulate",
  "import.map",
  "import.categorize",
] as const;

export type AICapability = (typeof AI_CAPABILITIES)[number];

export function isAICapability(value: string): value is AICapability {
  return (AI_CAPABILITIES as readonly string[]).includes(value);
}
