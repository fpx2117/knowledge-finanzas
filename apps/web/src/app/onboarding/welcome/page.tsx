import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { WelcomeStepForm } from "@/features/onboarding/components/welcome-step-form";
import { OnboardingIntro, OnboardingWelcomeVisual } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingWelcomePage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "WELCOME" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step (Acceptance Criterion: analytics failure never blocks progression).
  }

  return (
    <section className="onboarding-step onboarding-step-welcome"><OnboardingIntro title="Bienvenido a KNOWLEDGE Finance" description="Vamos a configurar tu espacio financiero en pocos pasos." /><OnboardingWelcomeVisual /><div className="onboarding-actions"><span>Enter ↵</span><WelcomeStepForm /></div></section>
  );
}
