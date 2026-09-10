import { AsyncLocalStorage } from "node:async_hooks";

// Carries the caller-side identity of an AI generation (who, which capability, which operation)
// from `executeAICapability` down to the provider decorator, without threading it through every
// capability function signature. The provider itself still never *depends* on this — the
// telemetry decorator reads it, and falls back to nulls when there is no context (e.g. a capability
// invoked outside executeAICapability).
export type GenerationContext = {
  userId: string;
  capability: string;
  operationId: string;
  creditsCharged: number | null;
};

const storage = new AsyncLocalStorage<GenerationContext>();

export function runWithGenerationContext<T>(context: GenerationContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(context, fn);
}

export function getGenerationContext(): GenerationContext | undefined {
  return storage.getStore();
}
