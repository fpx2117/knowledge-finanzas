import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { TypedTransactionsView } from "@/features/transactions/components/typed-transactions-view";

// spec 03 §10 — Gastos: filtro semántico sobre movimientos confirmados de salida.
export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ period?: string; page?: string }> }) {
  const user = await requireCurrentUser();
  return (
    <TypedTransactionsView
      userId={user.id}
      timezone={user.timezone}
      baseCurrency={user.baseCurrency}
      kind="EXPENSE"
      searchParams={await searchParams}
    />
  );
}
