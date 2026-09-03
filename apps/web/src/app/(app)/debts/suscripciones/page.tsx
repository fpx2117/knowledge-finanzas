import Link from "next/link";
import { ArrowLeftIcon, CreditCardIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { subscriptionDetectionService } from "@/features/transactions/services/subscription-detection-service.instance";
import { SubscriptionList, SubscriptionScanButton } from "@/features/transactions/components/subscription-list";

export default async function SubscriptionsPage() {
  const user = await requireCurrentUser();
  const subscriptions = await subscriptionDetectionService.listSubscriptions(user.id);
  const active = subscriptions.filter((s) => s.status === "ACTIVE");
  const monthlyTotal = active.reduce(
    (sum, s) => sum + (s.frequency === "MONTHLY" ? Number(s.currentAmount) : s.frequency === "YEARLY" ? Number(s.currentAmount) / 12 : 0),
    0,
  );
  const currency = active[0]?.currencyCode ?? "ARS";

  return (
    <div className="flex flex-col gap-8">
      <Link href="/debts" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Obligaciones
      </Link>

      <PageHeader
        title="Suscripciones"
        description="Cargos que se repiten todos los meses o todos los años. KNOWLEDGE también te avisa cuando alguno sube de precio."
        actions={<SubscriptionScanButton hasAny={subscriptions.length > 0} />}
      />

      {active.length > 0 ? (
        <p className="text-small text-muted-foreground">
          Estás gastando aprox.{" "}
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(monthlyTotal)}
          </span>{" "}
          por mes en suscripciones.
        </p>
      ) : null}

      <SectionCard title="Detectadas" eyebrow={`${subscriptions.length}`} contentClassName="gap-0">
        {subscriptions.length > 0 ? (
          <SubscriptionList subscriptions={subscriptions} />
        ) : (
          <EmptyState
            icon={<CreditCardIcon />}
            title="Nada detectado por ahora"
            description="Buscamos cargos del mismo comercio, mensuales o anuales, al menos 3 veces. Cargá más movimientos o volvé a buscar más adelante."
          />
        )}
      </SectionCard>
    </div>
  );
}
