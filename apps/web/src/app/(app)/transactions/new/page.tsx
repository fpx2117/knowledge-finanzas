import Link from "next/link";
import { accountRepository, categoryRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createAccountService } from "@/features/accounts/services/account-service";
import { createCategoryService } from "@/features/categories/services/category-service";
import { createIncomeAction } from "@/features/transactions/actions/create-income";
import { createExpenseAction } from "@/features/transactions/actions/create-expense";
import { TransactionForm } from "@/features/transactions/components/transaction-form";

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireCurrentUser();
  const mode = (await searchParams).type === "INCOME" ? "INCOME" : "EXPENSE";
  const accounts = await createAccountService({ accounts: accountRepository }).listAccounts(user.id);
  const categories = await createCategoryService({ categories: categoryRepository }).listCategories(user.id, { type: mode });
  return <><Link className="back-link" href="/transactions">← Volver a movimientos</Link><div className="form-page-header"><p className="eyebrow">Nuevo movimiento</p><h1>{mode === "EXPENSE" ? "Registrá un gasto." : "Registrá un ingreso."}</h1><p className="lede">El movimiento se guardará como publicado y afectará el saldo de la cuenta.</p></div><TransactionForm mode={mode} accounts={accounts} categories={categories} action={mode === "EXPENSE" ? createExpenseAction : createIncomeAction} /></>;
}
