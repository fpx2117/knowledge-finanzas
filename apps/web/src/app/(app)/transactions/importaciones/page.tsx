import { accountRepository } from "@know-finanzas/db";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { ImportWizard } from "@/features/imports/components/import-wizard";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";

export default async function ImportPage() {
  const user = await requireCurrentUser();
  const accounts = await accountRepository.listForUser(user.id);
  const options = accounts
    .filter((a) => a.status === "ACTIVE")
    .map((a) => ({ id: a.id, name: a.name, currencyCode: a.currencyCode }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Importar movimientos"
        description="Subí el CSV que exportás de tu banco o billetera. Detectamos las columnas solas, te mostramos una vista previa y salteamos lo que ya tengas cargado."
      />

      <TransactionsSubnav />

      <SectionCard title="Archivo">
        {options.length > 0 ? (
          <ImportWizard accounts={options} />
        ) : (
          <EmptyState
            title="Primero creá una cuenta"
            description="Necesitás al menos una cuenta activa para importar movimientos."
          />
        )}
      </SectionCard>
    </div>
  );
}
