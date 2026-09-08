import Link from "next/link";
import { FilterIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { categoryService } from "@/features/categories/services/category-service.instance";
import { classificationRuleService } from "@/features/transactions/services/classification-rule-service.instance";
import { RuleNewForm } from "@/features/transactions/components/rule-new-form";
import { RuleList } from "@/features/transactions/components/rule-list";

export default async function ClassificationRulesPage() {
  const user = await requireCurrentUser();
  const [rules, categories] = await Promise.all([
    classificationRuleService.listRules(user.id),
    categoryService.listCategories(user.id),
  ]);
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, type: c.type }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reglas de categorización"
        description="Reglas explícitas que siempre ganan sobre la categoría sugerida automáticamente. Se evalúan de arriba hacia abajo — la primera que coincide define la categoría."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Tus reglas" eyebrow={`${rules.length}`} contentClassName="gap-0">
          {rules.length > 0 ? (
            <RuleList rules={rules} />
          ) : (
            <EmptyState
              icon={<FilterIcon />}
              title="Todavía no tenés reglas"
              description="Creá una para forzar la categoría de un comercio o un tipo de movimiento sin depender de la sugerencia automática."
            />
          )}
        </SectionCard>

        <SectionCard title="Nueva regla">
          {categoryOptions.length > 0 ? (
            <RuleNewForm categories={categoryOptions} />
          ) : (
            <p className="text-small text-muted-foreground">
              Primero creá algunas <Link href="/settings/categories" className="text-brand hover:underline">categorías</Link>.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
