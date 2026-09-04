import { FormPage } from "@/components/shared/form-page";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { DebtForm } from "@/features/debts/components/debt-form";

export default async function NewDebtPage() {
  const user = await requireCurrentUser();
  return (
    <FormPage
      backHref="/obligations"
      backLabel="Volver a obligaciones"
      eyebrow="Nueva obligación"
      title="Registrá una deuda o compra en cuotas"
      description="Generamos el calendario de cuotas y te avisamos cuando cada una está por vencer."
    >
      <DebtForm timezone={user.timezone} baseCurrency={user.baseCurrency} />
    </FormPage>
  );
}
