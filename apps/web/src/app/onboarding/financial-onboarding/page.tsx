import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { resolveAccessRoute } from "@/lib/onboarding/access-route.instance";
import { FirstAccountForm } from "@/features/onboarding/financial/components/first-account-form";
import { OnboardingIntro } from "@/components/onboarding/onboarding-shell";

// Reachable only once access is TRIAL/PRO and no account exists yet — a completed financial
// onboarding (an account already exists) redirects straight to the dashboard, and NO_ACCESS/
// incomplete profile onboarding send the user back to the step they actually belong on.
export default async function FinancialOnboardingPage() {
  const user = await requireCurrentUser();
  const gate = await resolveAccessRoute(user.id);

  if (gate.destination === "ONBOARDING") redirect("/onboarding");
  if (gate.destination === "ACCESS_SELECTION") redirect("/elegir-acceso");
  if (gate.destination === "CONTINUE") redirect("/dashboard");

  return (
    <section className="onboarding-step"><OnboardingIntro title="Creá tu primera cuenta" description="Es el último paso para empezar a ver tu dinero con claridad." /><p className="onboarding-form-note">Podés agregar más cuentas después. El saldo inicial no se registra como un ingreso.</p><FirstAccountForm /></section>
  );
}
