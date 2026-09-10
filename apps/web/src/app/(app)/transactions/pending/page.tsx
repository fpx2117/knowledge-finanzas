import Link from "next/link";
import { CopyCheckIcon, RepeatIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { pendingReviewService } from "@/features/transactions/services/pending-review-service.instance";
import { duplicateReviewService } from "@/features/transactions/services/duplicate-review-service.instance";
import { recurringDetectionService } from "@/features/transactions/services/recurring-detection-service.instance";
import { PendingReviewList } from "@/features/transactions/components/pending-review-list";
import { DuplicateReviewList } from "@/features/transactions/components/duplicate-review-list";
import { RecurringScanButton, RecurringSuggestionList } from "@/features/transactions/components/recurring-suggestions";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";

// Pendientes es la única superficie de "esto necesita tu decisión" (spec 03 + consolidación
// 2026-09): gastos sin categoría, cargos recurrentes detectados y posibles duplicados son todos
// excepciones que el ledger marca — no tres features sueltas. Antes eran 3 rutas (/duplicados,
// /recurring) hoy plegadas acá como secciones ancladas (#recurrentes / #duplicados).
export default async function PendingTransactionsPage() {
  const user = await requireCurrentUser();
  const [pending, recurring, duplicatePairs] = await Promise.all([
    pendingReviewService.getUncategorized(user.id),
    recurringDetectionService.listSuggestions(user.id).catch(() => []),
    duplicateReviewService.scanForUser(user.id),
  ]);

  const total = pending.count + recurring.length + duplicatePairs.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pendientes"
        description="Movimientos que necesitan una decisión tuya: sin categoría, cargos que se repiten o posibles duplicados."
        actions={<RecurringScanButton hasSuggestions={recurring.length > 0} />}
      />

      <TransactionsSubnav />

      {total === 0 ? (
        <EmptyState
          size="section"
          icon={<CopyCheckIcon />}
          title="Todo en orden."
          description="No hay movimientos sin categoría, cargos recurrentes por confirmar ni duplicados para revisar."
        />
      ) : (
        <div className="flex flex-col gap-5">
          <SectionCard title="Sin categoría" eyebrow={`${pending.count}`}>
            {pending.items.length > 0 && pending.categoryOptions.length > 0 ? (
              <PendingReviewList items={pending.items} categories={pending.categoryOptions} />
            ) : pending.categoryOptions.length === 0 ? (
              <p className="py-4 text-center text-small text-muted-foreground">
                Primero creá algunas{" "}
                <Link href="/settings/categories" className="text-brand hover:underline">
                  categorías de gasto
                </Link>
                .
              </p>
            ) : (
              <EmptyState title="Nada pendiente" description="Todos tus gastos tienen categoría." />
            )}
          </SectionCard>

          <div id="recurrentes" className="scroll-mt-20">
            <SectionCard
              title="Actividad recurrente detectada"
              eyebrow={`${recurring.length}`}
              subtitle="Mismo comercio, monto parecido, cada cierto tiempo. Confirmá los que reconozcas."
            >
              {recurring.length > 0 ? (
                <RecurringSuggestionList suggestions={recurring} />
              ) : (
                <EmptyState
                  icon={<RepeatIcon />}
                  title="Nada detectado por ahora"
                  description="Necesitamos al menos 3 movimientos parecidos y espaciados de forma regular."
                />
              )}
            </SectionCard>
          </div>

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
      )}
    </div>
  );
}
