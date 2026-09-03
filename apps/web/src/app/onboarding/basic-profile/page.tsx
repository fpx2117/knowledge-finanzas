import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { BasicProfileStepForm } from "@/features/onboarding/components/basic-profile-step-form";
import { OnboardingIntro } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingBasicProfilePage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "BASIC_PROFILE" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="onboarding-step"><OnboardingIntro title="Configurá tu moneda y país" description="Esto nos ayuda a mostrarte la información correcta." /><BasicProfileStepForm /></section>
  );
}
