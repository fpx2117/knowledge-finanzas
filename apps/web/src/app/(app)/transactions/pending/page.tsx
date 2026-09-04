import Link from "next/link";
import { CopyCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { pendingReviewService } from "@/features/transactions/services/pending-review-service.instance";
import { duplicateReviewService } from "@/features/transactions/services/duplicate-review-service.instance";
import { PendingReviewList } from "@/features/transactions/components/pending-review-list";
import { DuplicateReviewList } from "@/features/transactions/components/duplicate-review-list";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";

// Pendientes is the single "needs your review" surface (spec 03): uncategorized expenses and
// possible duplicates are both exceptions the ledger flags, not two unrelated features — ADR-
// IMPL-001 folds what used to be a separate /transactions/duplicados route in here as a second
// section, reachable directly via the #duplicados anchor (see TransactionsSubnav).
export default async function PendingTransactionsPage() {
  const user = await requireCurrentUser();
  const [pending, duplicatePairs] = await Promise.all([
    pendingReviewService.getUncategorized(user.id),
    duplicateReviewService.scanForUser(user.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Pendientes"
        description="Movimientos que necesitan una decisión tuya: sin categoría o posibles duplicados."
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

      <div id="duplicados" className="scroll-mt-20">
        <SectionCard title="Posibles duplicados" eyebrow={`${duplicatePairs.length}`}>
          {duplicatePairs.length > 0 ? (
            <DuplicateReviewList pairs={duplicatePairs} />
          ) : (
            <EmptyState
              icon={<CopyCheckIcon />}
              title="No encontramos duplicados"
              description="Ningún par de movimientos de los últimos 6 meses parece repetido."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
