import type { GenerationTelemetry, TelemetryRecorder } from "@know-finanzas/ai";
import { createAIGenerationEventRepository, db } from "@know-finanzas/db";

const events = createAIGenerationEventRepository(db);

// Persists one ai_generation_events row per real provider call — the source of truth for per-user
// AI spend and app-wide AI cost. A call with no caller context (userId null) is still recorded so
// nothing is silently lost. Failures here are already swallowed by the telemetry provider wrapper.
export const generationTelemetryRecorder: TelemetryRecorder = {
  async record(event: GenerationTelemetry): Promise<void> {
    if (!event.userId) return; // no user to attribute the cost to — nothing actionable to store
    await events.record({
      userId: event.userId,
      capability: event.capability,
      modelRole: event.modelRole,
      resolvedModel: event.resolvedModel,
      provider: event.provider,
      generationId: event.generationId,
      operationId: event.operationId,
      status: event.status,
      errorCode: event.errorCode ?? null,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      cachedInputTokens: event.cachedInputTokens,
      costUsd: event.costUsd,
      creditsCharged: event.creditsCharged,
      latencyMs: event.latencyMs,
    });
  },
};
