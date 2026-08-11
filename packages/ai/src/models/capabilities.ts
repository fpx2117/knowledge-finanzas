import { AIError } from "../errors";
import type { ModelRole } from "./roles";

export type ModelCapability = "structuredOutputs" | "toolCalling" | "streaming" | "reasoning";
export type ModelCapabilities = Record<ModelCapability, boolean>;

// V1 default: every configured role supports structured outputs (the only capability any
// current AI capability requires — see docs/08-ai-openrouter.md §62-63). Tool calling/streaming
// become relevant once the assistant/scenario capabilities (out of this task's scope) exist.
const DEFAULT_CAPABILITIES: ModelCapabilities = {
  structuredOutputs: true,
  toolCalling: false,
  streaming: false,
  reasoning: false,
};

export function getModelCapabilities(role: ModelRole): ModelCapabilities {
  if (role === "REASONING") return { ...DEFAULT_CAPABILITIES, reasoning: true };
  return DEFAULT_CAPABILITIES;
}

// Validates compatibility before a request is sent (docs/08-ai-openrouter.md §99) — never assume
// every endpoint of a role's model supports the same capabilities as another.
export function validateModelCompatibility(role: ModelRole, required: Partial<ModelCapabilities>) {
  const capabilities = getModelCapabilities(role);
  for (const [capability, isRequired] of Object.entries(required) as Array<[ModelCapability, boolean | undefined]>) {
    if (isRequired && !capabilities[capability]) {
      throw new AIError("AI_MODEL_UNSUPPORTED", { field: capability });
    }
  }
}
