import { createGetAIUsageSummary } from "@know-finanzas/ai";
import { createAICreditRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

// Real, production-wired AI usage read model. Kept in its own module for the same reason as
// product-access-gate.instance.ts: importing it always pulls in the real db client and env
// validation, so nothing that needs to stay test-safe should import from here.
export const getAIUsageSummary = createGetAIUsageSummary(createAICreditRepository(db), {
  trialCreditsTotal: env.TRIAL_AI_CREDITS_TOTAL,
  proCreditsPerPeriod: env.PRO_AI_CREDITS_PER_PERIOD,
});
