import { createAccountRepository, db } from "@know-finanzas/db";

import { resolveOnboardingGate, type OnboardingGateResolution } from "@/features/onboarding/services/resolve-onboarding-route";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
import { onboardingService } from "./onboarding-service.instance";

const accounts = createAccountRepository(db);

// Composes TASK-063's onboarding state, the real ProductAccessGate, and "has this user created a
// first account yet" into the single routing decision docs/23-onboarding-firstuse.md describes.
// Used by the (app) layout (enforced redirect) and by /elegir-acceso /
// /onboarding/financial-onboarding themselves (so a user can't reach those pages out of turn via
// a direct URL once they've moved past that stage).
export async function resolveAccessRoute(userId: string): Promise<OnboardingGateResolution> {
  const [onboardingState, productAccessState, hasAccount] = await Promise.all([
    onboardingService.getOnboardingState(userId),
    productAccessGate.getAccessState(userId),
    accounts.hasAnyForUser(userId),
  ]);

  return resolveOnboardingGate({
    onboardingStatus: onboardingState.status,
    productAccessState,
    financialOnboardingCompleted: hasAccount,
  });
}
