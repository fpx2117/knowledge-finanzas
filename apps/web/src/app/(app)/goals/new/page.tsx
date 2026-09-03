import { FormPage } from "@/components/shared/form-page";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { GoalForm } from "@/features/goals/components/goal-form";

export default async function NewGoalPage() {
  const user = await requireCurrentUser();

  return (
    <FormPage
      backHref="/goals"
      backLabel="Volver a metas"
      eyebrow="Nueva meta"
      title="Definí tu meta de ahorro"
      description="Ponele un objetivo y una fecha; después vas registrando cuánto vas juntando."
    >
      <GoalForm baseCurrency={user.baseCurrency} />
    </FormPage>
  );
}
