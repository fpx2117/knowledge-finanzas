import { isAIError } from "../errors";
import type { AIProvider, GenerateStructuredInput, GenerateStructuredResult } from "../provider";
import { getGenerationContext } from "../telemetry/generation-context";
import type { TelemetryRecorder } from "../telemetry/types";

// Wraps an AIProvider so every generateStructured call emits a GenerationTelemetry event (real
// token usage + provider USD cost). The recorder is best-effort: a recorder failure is swallowed
// and never affects the generation result. Caller identity comes from the AsyncLocalStorage set
// by executeAICapability; outside that context userId/operationId/creditsCharged are null.
export function createTelemetryProvider(inner: AIProvider, recorder: TelemetryRecorder, now: () => number = () => Date.now()): AIProvider {
  return {
    async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>> {
      const context = getGenerationContext();
      const startedAt = now();

      try {
        const result = await inner.generateStructured(input);
        await safeRecord(recorder, {
          userId: context?.userId ?? null,
          capability: input.capability,
          promptVersion: input.promptVersion,
          modelRole: input.role,
          resolvedModel: result.model,
          provider: "openrouter",
          status: "SUCCESS",
          latencyMs: now() - startedAt,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cachedInputTokens: result.usage.cachedInputTokens ?? null,
          costUsd: result.usage.costUsd ?? null,
          generationId: result.generationId,
          operationId: context?.operationId ?? null,
          creditsCharged: context?.creditsCharged ?? null,
        });
        return result;
      } catch (error) {
        await safeRecord(recorder, {
          userId: context?.userId ?? null,
          capability: input.capability,
          promptVersion: input.promptVersion,
          modelRole: input.role,
          resolvedModel: null,
          provider: "openrouter",
          status: "FAILED",
          errorCode: isAIError(error) ? error.code : "AI_PROVIDER_ERROR",
          latencyMs: now() - startedAt,
          inputTokens: null,
          outputTokens: null,
          cachedInputTokens: null,
          costUsd: null,
          generationId: null,
          operationId: context?.operationId ?? null,
          creditsCharged: context?.creditsCharged ?? null,
        });
        throw error;
      }
    },
  };
}

async function safeRecord(recorder: TelemetryRecorder, event: Parameters<TelemetryRecorder["record"]>[0]): Promise<void> {
  try {
    await recorder.record(event);
  } catch (error) {
    console.error("[ai] generation telemetry record failed", error);
  }
}
