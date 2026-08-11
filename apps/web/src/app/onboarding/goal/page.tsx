import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { GoalStepForm } from "@/features/onboarding/components/goal-step-form";

export default async function OnboardingGoalPage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "GOAL" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="detail-card">
      <p className="card-label">Objetivo financiero</p>
      <h1>¿Qué es lo que más te importa ahora?</h1>
      <p className="lede">Esto solo ordena cómo te mostramos la app — nunca cambia ningún cálculo financiero.</p>
      <GoalStepForm />
    </section>
  );
}
