import { createGrantTrialCredits } from "@know-finanzas/ai";
import { createStartTrial } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { createAICreditRepository, createBillingSubscriptionRepository, createPromotionRepository, createUserRepository, db } from "@know-finanzas/db";

const grantTrialCredits = createGrantTrialCredits(createAICreditRepository(db), env.TRIAL_AI_CREDITS_TOTAL);

// Real, production-wired StartTrial used by the access-selection server action. Kept in its own
// instance module so importing the pure factory (in @know-finanzas/billing) never pulls in the
// real db client — matching every other *.instance.ts in this directory.
export const startTrial = createStartTrial({
  users: createUserRepository(db),
  subscriptions: createBillingSubscriptionRepository(db),
  promotions: createPromotionRepository(db),
  grantTrialCredits,
  trialDurationDays: env.TRIAL_DURATION_DAYS,
});
