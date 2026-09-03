import Link from "next/link";
import { ArrowLeftIcon, TagIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightCard } from "@/components/shared/insight-card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { categoryService as service } from "@/features/categories/services/category-service.instance";
import { CategoryManage } from "@/features/categories/components/category-manage";
import { CategoryNewForm } from "@/features/categories/components/category-new-form";
import { GenerateCategoriesButton } from "@/features/categories/components/generate-categories-button";

export default async function CategoriesSettingsPage() {
  const user = await requireCurrentUser();
  const [withMapping, expenseNodes, incomeNodes] = await Promise.all([
    service.listCategoriesWithMapping(user.id),
    service.listMappableNodes("EXPENSE"),
    service.listMappableNodes("INCOME"),
  ]);

  const active = withMapping.filter((c) => c.status === "ACTIVE");
  const archived = withMapping.filter((c) => c.status === "ARCHIVED");
  const expense = active.filter((c) => c.type === "EXPENSE");
  const income = active.filter((c) => c.type === "INCOME");
  const unmapped = active.filter((c) => !c.canonical).length;

  return (
    <div className="flex flex-col gap-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Configuración
      </Link>

      <PageHeader
        title="Categorías"
        description="Las que ves al cargar un movimiento. Detrás, cada una se asocia a una categoría canónica de KNOWLEDGE para que tus reportes y tendencias sean comparables."
      />

      {active.length === 0 ? (
        <EmptyState
          icon={<TagIcon />}
          title="Todavía no tenés categorías"
          description="Generá un set inicial de categorías de gastos e ingresos y ajustalas después a tu gusto."
          action={<GenerateCategoriesButton size="default" />}
        />
      ) : (
        <>
          {unmapped > 0 ? (
            <InsightCard title="Categorías sin asociar">
              <p>
                {unmapped} {unmapped === 1 ? "categoría no está asociada" : "categorías no están asociadas"} a una categoría canónica.
                Elegí una en el selector de cada fila para que entren en tus reportes agregados.
              </p>
            </InsightCard>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="flex flex-col gap-4">
              <SectionCard title="Gastos" eyebrow={`${expense.length} categorías`} contentClassName="gap-0">
                {expense.length > 0 ? (
                  <CategoryManage rows={expense} expenseNodes={expenseNodes} incomeNodes={incomeNodes} />
                ) : (
                  <p className="py-6 text-center text-small text-muted-foreground">Sin categorías de gasto.</p>
                )}
              </SectionCard>
              <SectionCard title="Ingresos" eyebrow={`${income.length} categorías`} contentClassName="gap-0">
                {income.length > 0 ? (
                  <CategoryManage rows={income} expenseNodes={expenseNodes} incomeNodes={incomeNodes} />
                ) : (
                  <p className="py-6 text-center text-small text-muted-foreground">Sin categorías de ingreso.</p>
                )}
              </SectionCard>
              {archived.length > 0 ? (
                <SectionCard title="Archivadas" eyebrow={`${archived.length}`} contentClassName="gap-0">
                  <ul className="flex flex-col divide-y divide-border">
                    {archived.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <span className="text-small text-muted-foreground">{c.name}</span>
                        <span className="text-caption text-muted-foreground">{c.canonical?.path ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              ) : null}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <SectionCard title="Nueva categoría">
                <CategoryNewForm />
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
