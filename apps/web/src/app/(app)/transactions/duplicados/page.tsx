import { CopyCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { duplicateReviewService } from "@/features/transactions/services/duplicate-review-service.instance";
import { DuplicateReviewList } from "@/features/transactions/components/duplicate-review-list";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";

export default async function DuplicatesReviewPage() {
  const user = await requireCurrentUser();
  const pairs = await duplicateReviewService.scanForUser(user.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Posibles duplicados"
        description="Movimientos parecidos de los últimos 6 meses — mismo monto, misma cuenta, fechas cercanas. Revisá cada par: anulá el repetido o marcá que son distintos."
      />

      <TransactionsSubnav />

      <SectionCard title="Para revisar" eyebrow={`${pairs.length}`}>
        {pairs.length > 0 ? (
          <DuplicateReviewList pairs={pairs} />
        ) : (
          <EmptyState
            icon={<CopyCheckIcon />}
            title="No encontramos duplicados"
            description="Ningún par de movimientos de los últimos 6 meses parece repetido."
          />
        )}
      </SectionCard>
    </div>
  );
}
