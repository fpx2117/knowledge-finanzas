import { accountRepository, categoryRepository } from "@know-finanzas/db";

import { FormPage } from "@/components/shared/form-page";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { TransactionForm } from "@/features/transactions/components/transaction-form";

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const user = await requireCurrentUser();

  const [accounts, categories] = await Promise.all([
    accountRepository.listForUser(user.id),
    categoryRepository.listForUser(user.id),
  ]);

  const defaultType = type === "INCOME" ? "INCOME" : "EXPENSE";

  return (
    <FormPage
      backHref="/transactions"
      backLabel="Volver a transacciones"
      eyebrow="Nueva transacción"
      title="Registrá un movimiento"
      description="Los ingresos y gastos actualizan el saldo de la cuenta al instante."
    >
      <TransactionForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name, type: c.type }))}
        timezone={user.timezone}
        defaultType={defaultType}
      />
    </FormPage>
  );
}
