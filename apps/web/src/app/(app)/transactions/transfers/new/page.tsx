import Link from "next/link";
import { ArrowLeftRightIcon } from "lucide-react";

import { accountRepository } from "@know-finanzas/db";

import { FormPage } from "@/components/shared/form-page";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { TransferForm } from "@/features/transfers/components/transfer-form";

export default async function NewTransferPage() {
  const user = await requireCurrentUser();
  const accounts = await accountRepository.listForUser(user.id);

  return (
    <FormPage
      backHref="/transactions"
      backLabel="Volver a transacciones"
      eyebrow="Movimiento interno"
      title="Transferí entre tus cuentas"
      description="Mové dinero de una cuenta a otra. No se registra como ingreso ni como gasto — tus activos consolidados no cambian."
    >
      {accounts.length < 2 ? (
        <EmptyState
          icon={<ArrowLeftRightIcon />}
          title="Necesitás dos cuentas"
          description="Creá otra cuenta activa para poder transferir dinero entre ellas."
          action={<Button render={<Link href="/accounts/new">Nueva cuenta</Link>} />}
        />
      ) : (
        <TransferForm
          accounts={accounts.map((a) => ({ id: a.id, name: a.name, currencyCode: a.currencyCode }))}
          timezone={user.timezone}
        />
      )}
    </FormPage>
  );
}
