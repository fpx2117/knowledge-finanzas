import Link from "next/link";
import { ArrowLeftIcon, RepeatIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { recurringDetectionService } from "@/features/transactions/services/recurring-detection-service.instance";
import { RecurringScanButton, RecurringSuggestionList } from "@/features/transactions/components/recurring-suggestions";

export default async function RecurringExpensesPage() {
  const user = await requireCurrentUser();
  const suggestions = await recurringDetectionService.listSuggestions(user.id);

  return (
    <div className="flex flex-col gap-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Volver
      </Link>

      <PageHeader
        title="Gastos recurrentes"
        description="KNOWLEDGE mira tus movimientos y detecta lo que se repite — mismo comercio, monto parecido, cada cierto tiempo. Confirmá los que reconozcas."
        actions={<RecurringScanButton hasSuggestions={suggestions.length > 0} />}
      />

      <SectionCard title="Detectados" eyebrow={`${suggestions.length}`} contentClassName="gap-0">
        {suggestions.length > 0 ? (
          <RecurringSuggestionList suggestions={suggestions} />
        ) : (
          <EmptyState
            icon={<RepeatIcon />}
            title="Nada detectado por ahora"
            description="Necesitamos al menos 3 movimientos parecidos y espaciados de forma regular. Cargá más movimientos o volvé a buscar más adelante."
          />
        )}
      </SectionCard>
    </div>
  );
}
