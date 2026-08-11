import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { BasicProfileStepForm } from "@/features/onboarding/components/basic-profile-step-form";

export default async function OnboardingBasicProfilePage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "BASIC_PROFILE" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="detail-card">
      <p className="card-label">Configuración básica</p>
      <h1>Un par de datos para arrancar.</h1>
      <p className="lede">Esto solo configura valores por defecto — no crea ninguna cuenta ni movimiento.</p>
      <BasicProfileStepForm />
    </section>
  );
}
