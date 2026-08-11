import { AIError } from "../errors";
import type { ModelRole } from "./roles";

export type ModelRegistryConfig = {
  fast: string | undefined;
  balanced: string | undefined;
  quality: string | undefined;
  reasoning: string | undefined;
};

// Central model resolution by role (docs/08-ai-openrouter.md §61, §100) — feature code must
// never hardcode a model id, only request a role.
export function resolveModel(role: ModelRole, config: ModelRegistryConfig): string {
  const modelByRole: Record<ModelRole, string | undefined> = {
    FAST: config.fast,
    BALANCED: config.balanced,
    QUALITY: config.quality,
    REASONING: config.reasoning,
  };

  const modelId = modelByRole[role];
  if (!modelId) throw new AIError("AI_MODEL_UNAVAILABLE", { field: role });
  return modelId;
}
