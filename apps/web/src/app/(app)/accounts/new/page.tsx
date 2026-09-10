import { accountRepository } from "@know-finanzas/db";

import { FormPage } from "@/components/shared/form-page";
import { AccountForm } from "@/features/accounts/components/account-form";
import { requireCurrentUser } from "@/lib/auth/require-current-user";

export default async function NewAccountPage() {
  const user = await requireCurrentUser();
  const isFirstAccount = !(await accountRepository.hasAnyForUser(user.id).catch(() => true));
  return (
    <FormPage
      backHref="/accounts"
      backLabel="Volver a cuentas"
      eyebrow="Nueva cuenta"
      title="Empezá por lo que tenés"
      description="El saldo inicial es un punto de partida, no un ingreso."
    >
      <AccountForm timezone={user.timezone} isFirstAccount={isFirstAccount} />
    </FormPage>
  );
}
