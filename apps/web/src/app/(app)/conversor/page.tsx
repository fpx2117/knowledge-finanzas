import { ArrowLeftRightIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { getBlueQuote } from "@/features/fx/services/fx-service";
import { CurrencyConverter } from "@/features/fx/components/currency-converter";
import { ReportsNav } from "@/features/reports/components/report-shared";

// Standalone "cuánto es esto en la otra moneda" tool. Not a report (no period), but lives under
// the Reports nav because that's where currency questions land.
export const dynamic = "force-dynamic";

export default async function ConversorPage() {
  await requireCurrentUser();
  const quote = await getBlueQuote();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Conversor"
        description="Pasá un monto de pesos a dólares y viceversa, al dólar blue."
        actions={<HeaderActions />}
      />

      <ReportsNav />

      <SectionCard title="Pesos ↔ Dólares" eyebrow="Dólar blue">
        {quote ? (
          <CurrencyConverter quote={quote.fx} asOf={quote.asOf} stale={quote.stale} />
        ) : (
          <EmptyState
            icon={<ArrowLeftRightIcon />}
            title="No pudimos obtener la cotización"
            description="La fuente del dólar blue no respondió y todavía no tenemos un valor guardado. Probá de nuevo en unos minutos."
          />
        )}
      </SectionCard>
    </div>
  );
}
