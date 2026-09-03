import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { GoalStepForm } from "@/features/onboarding/components/goal-step-form";
import { OnboardingIntro } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingGoalPage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "GOAL" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="onboarding-step"><OnboardingIntro title="¿Qué querés lograr primero?" description="Esto nos ayuda a personalizar tu experiencia." /><GoalStepForm /></section>
  );
}
