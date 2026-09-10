import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { billingPageService } from "@/features/billing/services/billing-page-service.instance";
import { CancelSubscriptionButton, StartTrialButton, UpgradeToProButton } from "@/features/billing/components/plan-actions";

const PLAN_LABEL: Record<string, string> = {
  FREE: "Gratis",
  TRIAL: "Prueba Pro",
  PRO: "Pro",
  EXPIRED_READ_ONLY: "Solo lectura",
  NO_ACCESS: "Sin acceso",
};

function money(amount: string, currency: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: currency === "ARS" ? 0 : 2 }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
}

const dateFmt = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });

export default async function PlanSettingsPage() {
  const user = await requireCurrentUser();
  const view = await billingPageService.getBillingPage(user.id);

  const ai = view.ai;
  const aiUsage =
    ai.state === "FREE" || ai.state === "TRIAL" || ai.state === "PRO"
      ? { used: Math.max(0, ai.total - ai.available), total: ai.total, available: ai.available }
      : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Plan" description="Tu plan, créditos de IA y facturación." />

      <SectionCard title="Plan actual">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={view.access === "PRO" ? "default" : "secondary"}>{PLAN_LABEL[view.access] ?? view.access}</Badge>
          {view.trial ? (
            <span className="text-caption text-muted-foreground">
              Te quedan {view.trial.daysRemaining} {view.trial.daysRemaining === 1 ? "día" : "días"} de prueba (hasta el {dateFmt.format(view.trial.expiresAt)}).
            </span>
          ) : null}
          {view.access === "PRO" && view.subscription?.currentPeriodEnd ? (
            <span className="text-caption text-muted-foreground">
              {view.subscription.cancelAtPeriodEnd ? "Finaliza" : "Se renueva"} el {dateFmt.format(view.subscription.currentPeriodEnd)}.
            </span>
          ) : null}
          {view.promotion ? (
            <span className="text-caption text-muted-foreground">Acceso por promoción hasta el {dateFmt.format(view.promotion.endsAt)}.</span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {view.access === "FREE" ? (
            <>
              <UpgradeToProButton />
              <StartTrialButton />
            </>
          ) : null}
          {view.access === "TRIAL" ? <UpgradeToProButton label="Pasar a Pro ahora" /> : null}
          {view.access === "PRO" && view.subscription && view.subscription.status !== "CANCELLED" ? (
            <CancelSubscriptionButton subscriptionId={view.subscription.id} />
          ) : null}
          {(view.access === "EXPIRED_READ_ONLY" || view.access === "NO_ACCESS") ? <UpgradeToProButton label="Activar Pro" /> : null}
        </div>

        <p className="mt-2 text-caption text-muted-foreground">
          <Link href="/pricing" className="text-brand hover:underline">
            Comparar planes y precios
          </Link>
        </p>
      </SectionCard>

      <SectionCard title="Créditos de IA" subtitle="Se usan en el asistente y en la categorización automática.">
        {aiUsage ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-h3 font-bold text-foreground">
                {aiUsage.available} <span className="text-small font-medium text-muted-foreground">de {aiUsage.total} disponibles</span>
              </span>
            </div>
            <ProgressBar
              value={aiUsage.total > 0 ? (aiUsage.used / aiUsage.total) * 100 : 0}
              aria-label={`${aiUsage.available} de ${aiUsage.total} créditos de IA disponibles`}
            />
            <span className="text-caption text-muted-foreground">
              {ai.state === "FREE" && "renewsAt" in ai && ai.renewsAt
                ? `Se renuevan el ${dateFmt.format(ai.renewsAt)}.`
                : ai.state === "TRIAL"
                  ? "Se agotan al terminar la prueba."
                  : ai.state === "PRO" && "renewsAt" in ai && ai.renewsAt
                    ? `Se renuevan el ${dateFmt.format(ai.renewsAt)}.`
                    : null}
              {ai.state === "FREE" ? " Con Pro tenés muchos más y modelos más potentes." : null}
            </span>
            {view.aiSpend && view.aiSpend.calls > 0 ? (
              <span className="text-caption text-muted-foreground">
                Costo real de la IA que usaste este período: ≈ US$ {Number(view.aiSpend.costUsd).toFixed(4)} ({view.aiSpend.calls}{" "}
                {view.aiSpend.calls === 1 ? "consulta" : "consultas"}). Es una referencia — no se te cobra.
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-small text-muted-foreground">Activá un plan para usar la IA.</p>
        )}
      </SectionCard>

      {view.payments.length > 0 ? (
        <SectionCard title="Pagos">
          <ul className="flex flex-col divide-y divide-border">
            {view.payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <span className="flex flex-col">
                  <span className="text-small font-medium text-foreground">{money(payment.grossAmount, payment.currencyCode)}</span>
                  <span className="text-caption text-muted-foreground">{dateFmt.format(payment.paidAt ?? payment.createdAt)}</span>
                </span>
                <Badge variant={payment.status === "APPROVED" ? "default" : "secondary"}>{payment.status}</Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}
