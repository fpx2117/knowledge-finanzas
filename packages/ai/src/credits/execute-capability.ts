import { AIError, isAIError, type AIErrorCode } from "../errors";
import type { AICapability } from "./capabilities";
import type { AICreditService } from "./credit-service";
import type { AIProductAccessState } from "./credit-policy";
import { runWithGenerationContext } from "../telemetry/generation-context";

export type ResolveAccessPort = (userId: string) => Promise<AIProductAccessState>;
export type CapabilityEntitlementPort = (input: { access: AIProductAccessState; capability: AICapability }) => Promise<boolean>;
export type RateLimitPort = (input: { userId: string; capability: AICapability }) => Promise<boolean>;

export type CapabilityUsageEvent = {
  userId: string;
  capability: AICapability;
  operationId: string;
  status: "SUCCESS" | "FAILED";
  errorCode?: AIErrorCode;
  credits: number | null;
  latencyMs: number;
};

export type CapabilityUsageTelemetry = {
  record(event: CapabilityUsageEvent): Promise<void>;
};

const alwaysEntitled: CapabilityEntitlementPort = async () => true;
const alwaysWithinLimit: RateLimitPort = async () => true;
const noopUsageTelemetry: CapabilityUsageTelemetry = { record: async () => {} };

export type ExecuteAICapabilityInput<T> = {
  userId: string;
  capability: AICapability;
  operationId: string;
  // `access` is the resolved product-access state — capabilities that pick a model role can use
  // it to downgrade FREE-tier calls to the fast model.
  execute: (context: { access: AIProductAccessState }) => Promise<T>;
};

// executeAICapability (docs/08.1-ai-credits-and-usage.md §73-77): resolve access → check
// entitlement → resolve credit cost → rate limit → reserve → execute → commit/release →
// telemetry. `execute` is an arbitrary callback (not coupled to AIProvider/generateStructured),
// so this wrapper can gate any capability execution, AI-provider-backed or not.
export function createExecuteAICapability(dependencies: {
  aiEnabled: boolean;
  creditService: AICreditService;
  resolveAccess: ResolveAccessPort;
  checkCapabilityEntitlement?: CapabilityEntitlementPort;
  checkRateLimit?: RateLimitPort;
  telemetry?: CapabilityUsageTelemetry;
  // Invoked once per call right after access is resolved and before any credit reservation — the
  // FREE tier uses it to lazily grant the current calendar month's allowance (idempotent). Must
  // not throw for the common case; a thrown error aborts the capability like any other.
  onAccessResolved?: (input: { userId: string; access: AIProductAccessState }) => Promise<void>;
  now?: () => number;
}) {
  const checkCapabilityEntitlement = dependencies.checkCapabilityEntitlement ?? alwaysEntitled;
  const checkRateLimit = dependencies.checkRateLimit ?? alwaysWithinLimit;
  const telemetry = dependencies.telemetry ?? noopUsageTelemetry;
  const now = dependencies.now ?? (() => Date.now());

  return async function executeAICapability<T>(input: ExecuteAICapabilityInput<T>): Promise<T> {
    const startedAt = now();

    if (!dependencies.aiEnabled) throw new AIError("AI_DISABLED");

    const access = await dependencies.resolveAccess(input.userId);
    if (access === "EXPIRED_READ_ONLY" || access === "NO_ACCESS") throw new AIError("AI_ACCESS_REQUIRED");

    await dependencies.onAccessResolved?.({ userId: input.userId, access });

    const entitled = await checkCapabilityEntitlement({ access, capability: input.capability });
    if (!entitled) throw new AIError("AI_ENTITLEMENT_REQUIRED");

    const withinLimit = await checkRateLimit({ userId: input.userId, capability: input.capability });
    if (!withinLimit) throw new AIError("AI_USAGE_RATE_LIMITED");

    const { reservation, cost } = await dependencies.creditService.reserve({
      userId: input.userId,
      access,
      capability: input.capability,
      operationId: input.operationId,
    });

    if (reservation.status !== "PENDING") {
      throw new AIError("AI_CREDIT_OPERATION_DUPLICATE");
    }

    try {
      // Carry the caller identity down to the provider telemetry decorator (real token/USD cost
      // per generation) without threading it through every capability signature.
      const result = await runWithGenerationContext(
        { userId: input.userId, capability: input.capability, operationId: input.operationId, creditsCharged: cost },
        () => input.execute({ access }),
      );
      await dependencies.creditService.commit(reservation.id);
      await telemetry.record({
        userId: input.userId,
        capability: input.capability,
        operationId: input.operationId,
        status: "SUCCESS",
        credits: cost,
        latencyMs: now() - startedAt,
      });
      return result;
    } catch (error) {
      await dependencies.creditService.release(reservation.id);
      const errorCode = isAIError(error) ? error.code : "AI_PROVIDER_ERROR";
      await telemetry.record({
        userId: input.userId,
        capability: input.capability,
        operationId: input.operationId,
        status: "FAILED",
        errorCode,
        credits: cost,
        latencyMs: now() - startedAt,
      });
      throw isAIError(error) ? error : new AIError("AI_PROVIDER_ERROR", { cause: error });
    }
  };
}

export type ExecuteAICapability = ReturnType<typeof createExecuteAICapability>;
