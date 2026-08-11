import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { resolveAccessRoute } from "@/lib/onboarding/access-route.instance";
import { FirstAccountForm } from "@/features/onboarding/financial/components/first-account-form";

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
    <section className="detail-card">
      <p className="card-label">¿Dónde manejás tu dinero?</p>
      <h1>Creá tu primera cuenta.</h1>
      <p className="lede">Es la única cuenta que necesitás para empezar — podés agregar más después. El saldo inicial no se registra como un ingreso.</p>
      <FirstAccountForm />
    </section>
  );
}
