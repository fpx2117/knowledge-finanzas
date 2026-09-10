import type { ZodType } from "zod";
import type { ModelRole } from "./models/roles";

export type GenerateStructuredInput<T> = {
  role: ModelRole;
  capability: string;
  promptVersion: string;
  system?: string;
  prompt: string;
  schema: ZodType<T>;
  schemaName: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
};

export type GenerateStructuredResult<T> = {
  data: T;
  raw: string;
  model: string;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    // Optional so lightweight test doubles stay terse; the real provider always populates them.
    cachedInputTokens?: number | null;
    // Real USD the provider charged for this call (null when not reported).
    costUsd?: number | null;
  };
  generationId: string | null;
};

// Server-only boundary: product features depend on this interface (and the capabilities built on
// top of it), never on an OpenRouter SDK/client directly (docs/08-ai-openrouter.md §57).
//
// generateStructured is the only capability this task implements. generateText/streamText are
// intentionally left out of the interface until a concrete capability needs them (task scope) —
// adding unused surface here would just be speculative API design.
export interface AIProvider {
  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>>;
}
