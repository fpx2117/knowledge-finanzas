import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { PrivacyConsentStepForm } from "@/features/onboarding/components/privacy-consent-step-form";

export default async function OnboardingPrivacyConsentPage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "PRIVACY_CONSENT" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="detail-card">
      <p className="card-label">Privacidad y consentimiento</p>
      <h1>Última pantalla — tu privacidad, tus reglas.</h1>
      <p className="lede">Podés cambiar esto en cualquier momento desde Configuración → Privacidad y datos.</p>
      <PrivacyConsentStepForm />
    </section>
  );
}
