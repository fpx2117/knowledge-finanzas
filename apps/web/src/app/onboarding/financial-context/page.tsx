import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { FinancialContextStepForm } from "@/features/onboarding/components/financial-context-step-form";

export default async function OnboardingFinancialContextPage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "FINANCIAL_CONTEXT" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="detail-card">
      <p className="card-label">Contexto financiero</p>
      <h1>Algunas preguntas rápidas (todas opcionales).</h1>
      <p className="lede">Sin montos exactos — solo Sí, No, o preferís no responder. Podés dejar todo sin marcar y continuar.</p>
      <FinancialContextStepForm />
    </section>
  );
}
