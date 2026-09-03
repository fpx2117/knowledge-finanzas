import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { FinancialContextStepForm } from "@/features/onboarding/components/financial-context-step-form";
import { OnboardingIntro } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingFinancialContextPage() {
  const user = await requireCurrentUser();
  try {
    await analyticsService("onboarding_step_viewed", { step: "FINANCIAL_CONTEXT" }, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the step
  }

  return (
    <section className="onboarding-step"><OnboardingIntro title="Contanos un poco sobre vos" description="Son preguntas opcionales. Podés saltearlas cuando quieras." /><FinancialContextStepForm /></section>
  );
}
