import { AIError, isAIError } from "./errors";
import type { AIProvider, GenerateStructuredInput, GenerateStructuredResult } from "./provider";
import { noopTelemetryRecorder, type TelemetryRecorder } from "./telemetry/types";

export type EntitlementCheckPort = (input: { userId: string; capability: string }) => Promise<boolean>;
export type UsageReservationPort = (input: { userId: string; capability: string }) => Promise<{ allowed: boolean; reservationId?: string }>;
export type UsageCommitPort = (input: { userId: string; reservationId?: string }) => Promise<void>;
export type UsageReleasePort = (input: { userId: string; reservationId?: string }) => Promise<void>;

const alwaysEntitled: EntitlementCheckPort = async () => true;
const alwaysReserve: UsageReservationPort = async () => ({ allowed: true });
const noopCommit: UsageCommitPort = async () => {};
const noopRelease: UsageReleasePort = async () => {};

// Orchestrates the full flow from docs/08-ai-openrouter.md §150: kill switch → entitlement →
// usage reservation → provider execution → commit/release → telemetry.
//
// AIProvider itself never sees credits, entitlements or billing (docs/08-ai-openrouter.md §55,
// §150.1) — this is the one seam allowed to know about them, and only through injected ports.
// Every port defaults to permissive/no-op so a capability can be wired today without the AI
// Usage Layer (TASK-052) or Entitlement Service (TASK-045) being passed in explicitly; production
// wiring supplies the real ports once those exist.
export function createAIExecutor(dependencies: {
  provider: AIProvider;
  aiEnabled: boolean;
  checkEntitlement?: EntitlementCheckPort;
  reserveUsage?: UsageReservationPort;
  commitUsage?: UsageCommitPort;
  releaseUsage?: UsageReleasePort;
  telemetry?: TelemetryRecorder;
  now?: () => number;
}) {
  const checkEntitlement = dependencies.checkEntitlement ?? alwaysEntitled;
  const reserveUsage = dependencies.reserveUsage ?? alwaysReserve;
  const commitUsage = dependencies.commitUsage ?? noopCommit;
  const releaseUsage = dependencies.releaseUsage ?? noopRelease;
  const telemetry = dependencies.telemetry ?? noopTelemetryRecorder;
  const now = dependencies.now ?? (() => Date.now());

  return {
    async generateStructured<T>(userId: string, input: GenerateStructuredInput<T>): Promise<GenerateStructuredResult<T>> {
      if (!dependencies.aiEnabled) throw new AIError("AI_DISABLED");

      const entitled = await checkEntitlement({ userId, capability: input.capability });
      if (!entitled) throw new AIError("AI_ACCESS_REQUIRED");

      const reservation = await reserveUsage({ userId, capability: input.capability });
      if (!reservation.allowed) throw new AIError("AI_CREDITS_EXHAUSTED");

      const startedAt = now();

      try {
        const result = await dependencies.provider.generateStructured(input);
        await commitUsage({ userId, reservationId: reservation.reservationId });
        await telemetry.record({
          userId,
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
          operationId: null,
          creditsCharged: null,
        });
        return result;
      } catch (error) {
        await releaseUsage({ userId, reservationId: reservation.reservationId });
        const errorCode = isAIError(error) ? error.code : "AI_PROVIDER_ERROR";
        await telemetry.record({
          userId,
          capability: input.capability,
          promptVersion: input.promptVersion,
          modelRole: input.role,
          resolvedModel: null,
          provider: "openrouter",
          status: "FAILED",
          errorCode,
          latencyMs: now() - startedAt,
          inputTokens: null,
          outputTokens: null,
          cachedInputTokens: null,
          costUsd: null,
          generationId: null,
          operationId: null,
          creditsCharged: null,
        });
        throw isAIError(error) ? error : new AIError("AI_PROVIDER_ERROR", { cause: error });
      }
    },
  };
}
