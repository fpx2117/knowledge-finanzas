import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { pendingReviewService } from "@/features/transactions/services/pending-review-service.instance";
import { PendingReviewList } from "@/features/transactions/components/pending-review-list";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";

export default async function PendingTransactionsPage() {
  const user = await requireCurrentUser();
  const pending = await pendingReviewService.getUncategorized(user.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Pendientes"
        description="Gastos que quedaron sin categoría. Asignales una acá y salen de la lista."
      />

      <TransactionsSubnav />

      <SectionCard title="Sin categoría" eyebrow={`${pending.count}`}>
        {pending.items.length > 0 && pending.categoryOptions.length > 0 ? (
          <PendingReviewList items={pending.items} categories={pending.categoryOptions} />
        ) : pending.categoryOptions.length === 0 ? (
          <p className="py-4 text-center text-small text-muted-foreground">
            Primero creá algunas <Link href="/settings/categories" className="text-brand hover:underline">categorías de gasto</Link>.
          </p>
        ) : (
          <EmptyState title="Nada pendiente" description="Todos tus gastos tienen categoría." />
        )}
      </SectionCard>
    </div>
  );
}
