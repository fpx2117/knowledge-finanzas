import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { StatisticalProfileStepForm } from "@/features/onboarding/components/statistical-profile-step-form";

export default async function OnboardingStatisticalProfilePage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "STATISTICAL_PROFILE" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="detail-card">
      <p className="card-label">Perfil estadístico (opcional)</p>
      <h1>¿Nos contás un poco más sobre vos?</h1>
      <p className="lede">Totalmente opcional. Se usa solo de forma agregada y anónima, nunca afecta tu acceso al producto.</p>
      <StatisticalProfileStepForm />
    </section>
  );
}
