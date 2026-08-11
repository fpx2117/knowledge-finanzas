import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { WelcomeStepForm } from "@/features/onboarding/components/welcome-step-form";

export default async function OnboardingWelcomePage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "WELCOME" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step (Acceptance Criterion: analytics failure never blocks progression).
  }

  return (
    <section className="detail-card">
      <p className="card-label">Bienvenido/a</p>
      <h1>Empecemos por conocerte un poco.</h1>
      <p className="lede">Son unas pocas preguntas rápidas, casi todas opcionales. Nada de esto crea cuentas ni movimientos.</p>
      <WelcomeStepForm />
    </section>
  );
}
