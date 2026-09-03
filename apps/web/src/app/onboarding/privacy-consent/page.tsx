import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { PrivacyConsentStepForm } from "@/features/onboarding/components/privacy-consent-step-form";
import { OnboardingIntro } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingPrivacyConsentPage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "PRIVACY_CONSENT" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="onboarding-step"><OnboardingIntro title="Tu privacidad, tus reglas" description="Podés cambiar estas preferencias en cualquier momento." /><PrivacyConsentStepForm /></section>
  );
}
