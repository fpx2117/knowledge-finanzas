import Link from "next/link";
import { ArrowLeftIcon, CreditCardIcon } from "lucide-react";

import { merchantRepository } from "@know-finanzas/db";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { subscriptionDetectionService } from "@/features/transactions/services/subscription-detection-service.instance";
import { NewSubscriptionButton, SubscriptionList, SubscriptionScanButton } from "@/features/transactions/components/subscription-list";

export default async function SubscriptionsPage() {
  const user = await requireCurrentUser();
  const subscriptions = await subscriptionDetectionService.listSubscriptions(user.id);
  const merchantIdentities = await merchantRepository.identitiesByIds(subscriptions.map((s) => s.merchantId));
  const active = subscriptions.filter((s) => s.status === "ACTIVE");
  const monthlyTotal = active.reduce(
    (sum, s) => sum + (s.frequency === "MONTHLY" ? Number(s.currentAmount) : s.frequency === "YEARLY" ? Number(s.currentAmount) / 12 : 0),
    0,
  );
  const currency = active[0]?.currencyCode ?? "ARS";

  return (
    <div className="flex flex-col gap-8">
      <Link href="/obligations" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Obligaciones
      </Link>

      <PageHeader
        title="Suscripciones"
        description="Cargos que se repiten todos los meses o todos los años. KNOWLEDGE también te avisa cuando alguno sube de precio."
        actions={
          <>
            <NewSubscriptionButton timezone={user.timezone} />
            <SubscriptionScanButton hasAny={subscriptions.length > 0} />
          </>
        }
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
          <SubscriptionList
            subscriptions={subscriptions.map((s) => ({
              ...s,
              merchantName: merchantIdentities.get(s.merchantId)?.canonicalName ?? s.label,
              merchantDomain: merchantIdentities.get(s.merchantId)?.domain ?? null,
            }))}
          />
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
