import { createAICreditService, createExecuteAICapability, createInMemoryRateLimiter, isAIError, resolvePoolOrder, type ExecuteAICapabilityInput } from "@know-finanzas/ai";
import { createAICreditRepository, createUserRepository, db } from "@know-finanzas/db";
import { hasCapability } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
import { resolveEntitlementCapability } from "./capability-entitlement-map";
import { aiProvider } from "./openrouter-provider.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";

const creditService = createAICreditService(createAICreditRepository(db));
const users = createUserRepository(db);

async function trackAiTelemetry(event: { userId: string; capability: string; operationId: string; status: "SUCCESS" | "FAILED"; credits: number | null }) {
  const email = await users.findEmailById(event.userId);
  const internal = email ? isInternalAccount(email) : false;
  await analyticsService(
    "ai_capability_executed",
    { capability: event.capability, status: event.status, costCredits: event.credits },
    { eventId: `ai_capability_executed:${event.operationId}`, userId: event.userId, internal },
  );
}

// 20 calls per 5 minutes per (user, capability) — a pragmatic V1 ceiling (docs/17 §2 "Rate
// Limiting Foundation"); see in-memory-rate-limiter.ts for why this is per-process, not
// distributed.
const checkRateLimit = createInMemoryRateLimiter({ limit: 20, windowMs: 5 * 60 * 1000 });

// Real, production-wired executeAICapability: resolves access → entitlement → cost → rate limit
// → reserve → execute → commit/release → telemetry (TASK-052). Every AI capability action goes
// through this single instance so the safety invariants are enforced exactly once, in one place.
const baseExecuteAICapability = createExecuteAICapability({
  aiEnabled: env.AI_ENABLED,
  creditService,
  resolveAccess: (userId) => productAccessGate.getAccessState(userId),
  checkCapabilityEntitlement: async ({ access, capability }) => hasCapability(access, resolveEntitlementCapability(capability)),
  checkRateLimit,
  telemetry: {
    record: (event) => trackAiTelemetry({ userId: event.userId, capability: event.capability, operationId: event.operationId, status: event.status, credits: event.credits }),
  },
});

// AI_CREDITS_EXHAUSTED is thrown by creditService.reserve() BEFORE the base wrapper's own
// try/catch (it never reaches `telemetry.record`), so this outer wrapper is the only seam that
// can observe it — re-derives the pool order the same way creditService.reserve() did, purely to
// label which pool was exhausted for analytics; never changes the thrown error or its message.
export async function executeAICapability<T>(input: ExecuteAICapabilityInput<T>): Promise<T> {
  try {
    return await baseExecuteAICapability(input);
  } catch (error) {
    if (isAIError(error) && error.code === "AI_CREDITS_EXHAUSTED") {
      const access = await productAccessGate.getAccessState(input.userId);
      const pool = resolvePoolOrder(access)[0] ?? "PLAN_ALLOWANCE";
      const email = await users.findEmailById(input.userId);
      await analyticsService(
        "ai_credits_exhausted",
        { pool },
        { eventId: `ai_credits_exhausted:${input.operationId}`, userId: input.userId, internal: email ? isInternalAccount(email) : false },
      );
    }
    throw error;
  }
}

export { aiProvider };
