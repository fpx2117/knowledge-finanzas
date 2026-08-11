import type { AICapability } from "./capabilities";

// Credit Cost Catalog (docs/08.1-ai-credits-and-usage.md §19). Costs are per-execution, resolved
// before the provider is ever called, and stay stable even if the underlying model changes.
// `import.categorize` is not costed explicitly in the doc's "ejemplo inicial" table — priced the
// same as `import.map` since both are batch import capabilities of comparable cost.
const CREDIT_COSTS: Record<AICapability, number> = {
  "transaction.categorize": 1,
  "merchant.normalize": 1,
  "assistant.query.simple": 2,
  "cashflow.explain": 2,
  "budget.explain": 2,
  "debt.explain": 2,
  "action.prepare": 2,
  "assistant.query.complex": 4,
  "scenario.simulate": 4,
  "import.map": 5,
  "import.categorize": 5,
};

export function resolveCreditCost(capability: AICapability): number {
  return CREDIT_COSTS[capability];
}
