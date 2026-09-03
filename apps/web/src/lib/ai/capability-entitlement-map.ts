import type { AICapability } from "@know-finanzas/ai";
import type { CapabilityKey } from "@know-finanzas/billing";

// Correlates packages/ai's capability identifiers with packages/billing's entitlement capability
// keys. Lives here, not in either package, because it is the one place allowed to know about
// both bounded contexts (same reasoning as the rest of apps/web's instance-wiring modules).
const AI_CAPABILITY_TO_ENTITLEMENT: Record<AICapability, CapabilityKey> = {
  "transaction.categorize": "ai.categorization",
  "capture.parse": "ai.categorization",
  "merchant.normalize": "ai.categorization",
  "assistant.query.simple": "ai.assistant",
  "assistant.query.complex": "ai.assistant",
  "cashflow.explain": "ai.assistant",
  "budget.explain": "ai.assistant",
  "debt.explain": "ai.assistant",
  "action.prepare": "ai.actionPreparation",
  "scenario.simulate": "ai.scenarios",
  "import.map": "ai.categorization",
  "import.categorize": "ai.categorization",
};

export function resolveEntitlementCapability(capability: AICapability): CapabilityKey {
  return AI_CAPABILITY_TO_ENTITLEMENT[capability];
}
