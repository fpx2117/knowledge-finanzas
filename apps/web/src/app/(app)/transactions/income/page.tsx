import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { TypedTransactionsView } from "@/features/transactions/components/typed-transactions-view";

// spec 03 §11 — Ingresos: filtro semántico sobre movimientos confirmados de entrada.
export default async function IncomePage({ searchParams }: { searchParams: Promise<{ period?: string; page?: string }> }) {
  const user = await requireCurrentUser();
  return (
    <TypedTransactionsView
      userId={user.id}
      timezone={user.timezone}
      baseCurrency={user.baseCurrency}
      kind="INCOME"
      searchParams={await searchParams}
    />
  );
}
