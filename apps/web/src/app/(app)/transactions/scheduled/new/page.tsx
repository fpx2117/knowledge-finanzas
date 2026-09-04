import Link from "next/link";
import { accountRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createAccountService } from "@/features/accounts/services/account-service";
import { categoryService } from "@/features/categories/services/category-service.instance";
import { ScheduleTransactionForm } from "@/features/planning/components/schedule-transaction-form";

export default async function NewScheduledTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireCurrentUser();
  const mode = (await searchParams).type === "INCOME" ? "INCOME" : "EXPENSE";
  const accounts = await createAccountService({ accounts: accountRepository }).listAccounts(user.id);
  const categories = await categoryService.listCategories(user.id, { type: mode });

  return (
    <>
      <Link className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground" href="/transactions/scheduled">← Volver a planificación</Link>
      <div className="mb-8 max-w-[680px]">
        <p className="eyebrow">Nuevo movimiento programado</p>
        <h1>{mode === "EXPENSE" ? "Programá un gasto." : "Programá un ingreso."}</h1>
        <p className="mt-4 max-w-[490px] text-body-lg leading-relaxed text-muted-foreground">El movimiento queda programado para la fecha elegida — no afecta el saldo de la cuenta hasta que lo confirmes.</p>
      </div>
      <ScheduleTransactionForm mode={mode} accounts={accounts} categories={categories} />
    </>
  );
}
