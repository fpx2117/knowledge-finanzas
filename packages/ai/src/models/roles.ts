// Model roles (docs/08-ai-openrouter.md §59-61) — feature code never hardcodes a model id, only
// a role. The concrete model id per role lives in configuration (AI_MODEL_FAST, etc.).
export const MODEL_ROLES = ["FAST", "BALANCED", "QUALITY", "REASONING"] as const;

export type ModelRole = (typeof MODEL_ROLES)[number];
