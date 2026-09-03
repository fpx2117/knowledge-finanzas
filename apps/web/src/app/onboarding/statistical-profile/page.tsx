import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { StatisticalProfileStepForm } from "@/features/onboarding/components/statistical-profile-step-form";
import { OnboardingIntro } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingStatisticalProfilePage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "STATISTICAL_PROFILE" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="onboarding-step"><OnboardingIntro title="Personalizá tu experiencia" description="Es opcional y nunca afecta tu acceso al producto." /><StatisticalProfileStepForm /></section>
  );
}
