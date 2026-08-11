import type { OnboardingStatus } from "../schemas/onboarding-schemas";

// A local mirror of @know-finanzas/billing's ProductAccessState — this feature deliberately
// doesn't import packages/billing (the routing guard only needs the four state labels, not the
// resolver logic), matching the decoupled-mirror pattern already used by packages/ai.
export type AccessRouteProductAccessState = "NO_ACCESS" | "TRIAL" | "PRO" | "EXPIRED_READ_ONLY";

export type OnboardingGateResolution =
  | { destination: "ONBOARDING" }
  | { destination: "ACCESS_SELECTION" }
  | { destination: "FINANCIAL_ONBOARDING" }
  | { destination: "CONTINUE" };

// TASK-064's full algorithm (completing the chain TASK-063 started): authenticated? → onboarding
// completed? → access? → financial onboarding? → dashboard.
// IN_PROGRESS/NOT_STARTED → ONBOARDING
// COMPLETED + NO_ACCESS → ACCESS_SELECTION (/elegir-acceso)
// COMPLETED + (TRIAL/PRO) + financial onboarding not done → FINANCIAL_ONBOARDING
// COMPLETED + (TRIAL/PRO) + financial onboarding done → CONTINUE (dashboard/app)
// COMPLETED + EXPIRED_READ_ONLY → CONTINUE (app in read-only mode — never blocked from reaching
// the app itself; ProductAccessGate is what enforces read-only at the write-service layer)
export function resolveOnboardingGate(input: {
  onboardingStatus: OnboardingStatus;
  productAccessState: AccessRouteProductAccessState;
  financialOnboardingCompleted: boolean;
}): OnboardingGateResolution {
  if (input.onboardingStatus !== "COMPLETED") return { destination: "ONBOARDING" };
  if (input.productAccessState === "NO_ACCESS") return { destination: "ACCESS_SELECTION" };
  if (input.productAccessState === "EXPIRED_READ_ONLY") return { destination: "CONTINUE" };
  if (!input.financialOnboardingCompleted) return { destination: "FINANCIAL_ONBOARDING" };
  return { destination: "CONTINUE" };
}
