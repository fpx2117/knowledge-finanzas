import { createBillingPaymentRepository, createBillingPlanRepository, createBillingSubscriptionRepository, createPromotionRepository, createUserRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { getAIUsageSummary } from "@/lib/billing/ai-usage-summary.instance";
import { MoneyAmount } from "@/components/financial/money-amount";
import { SubscribeButton } from "@/features/billing/components/subscribe-button";
import { CancelSubscriptionDialog } from "@/features/billing/components/cancel-subscription-dialog";
import { RefreshSubscriptionButton } from "@/features/billing/components/refresh-subscription-button";
import { createBillingPageService, type BillingPageView } from "@/features/billing/services/billing-page-service";
import { RedeemPromotionCodeForm } from "@/features/promotions/components/redeem-promotion-code-form";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

const service = createBillingPageService({
  users: createUserRepository(db),
  subscriptions: createBillingSubscriptionRepository(db),
  plans: createBillingPlanRepository(db),
  payments: createBillingPaymentRepository(db),
  promotions: createPromotionRepository(db),
  ai: getAIUsageSummary,
  graceDays: env.BILLING_GRACE_PERIOD_DAYS,
  trialWhatsAppTotal: env.TRIAL_WHATSAPP_TOTAL,
  proWhatsAppPerPeriod: env.PRO_WHATSAPP_PER_PERIOD,
});

const CANCELLABLE_STATUSES = new Set(["ACTIVE", "PAST_DUE"]);

export default async function BillingSettingsPage() {
  const user = await requireCurrentUser();
  const view = await service.getBillingPage(user.id);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={<div className="mb-7 flex gap-2 text-sm text-muted-foreground"><span>Configuración</span><span aria-hidden="true">/</span><span>Suscripción</span></div>}
        title="Suscripción y uso"
        description="Revisá tu acceso, tus créditos de IA y tu historial de pagos."
      />

      <StateBanner view={view} />
      {(view.accessSource === "TRIAL" || view.accessSource === "NONE") && <RedeemPromotionCodeForm />}
      <UsageSection view={view} />
      <PaymentHistory payments={view.payments} />
    </PageContainer>
  );
}

function StateBanner({ view }: { view: BillingPageView }) {
  if (view.accessSource === "PROMOTION" && view.promotion) {
    return (
      <Card role="status">
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Pro promocional</p>
          <p className="text-h2 text-foreground">Acceso Pro hasta el {formatDate(view.promotion.endsAt)}</p>
          <p className="text-sm text-muted-foreground">
            Este acceso es promocional, no una suscripción paga — no se te va a cobrar nada al vencer. Podés suscribirte
            en cualquier momento para conservar el acceso Pro después.
          </p>
          <div><SubscribeButton /></div>
        </CardContent>
      </Card>
    );
  }

  if (view.access === "TRIAL") {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Prueba gratuita</p>
          <p className="text-h2 text-foreground">{view.trial?.daysRemaining ?? 0} días restantes</p>
          <p className="text-sm text-muted-foreground">Después de la prueba, Know Finanzas Pro cuesta USD 7.99 por mes. No pedimos tarjeta hasta que decidas suscribirte.</p>
          <div><SubscribeButton /></div>
        </CardContent>
      </Card>
    );
  }

  if (view.access === "PRO" && view.subscription) {
    const canCancel = CANCELLABLE_STATUSES.has(view.subscription.status);
    return (
      <Card>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{view.subscription.plan?.name ?? "Know Finanzas Pro"}</p>
          <p className="text-h2 text-foreground">{view.subscription.plan && <MoneyAmount amount={view.subscription.plan.price} currency={view.subscription.plan.currencyCode} />} <span className="text-sm font-normal text-muted-foreground">/ mes</span></p>
          {view.subscription.status === "PAST_DUE" ? (
            <p className="text-sm text-muted-foreground">Tu último pago no se pudo procesar. Mercado Pago va a reintentarlo; si no se resuelve, tu acceso Pro va a pasar a solo lectura.</p>
          ) : (
            <p className="text-sm text-muted-foreground">{view.subscription.currentPeriodEnd ? <>Se renueva el {formatDate(view.subscription.currentPeriodEnd)}.</> : "Suscripción activa."}</p>
          )}
          <div className="flex items-center gap-2">
            <RefreshSubscriptionButton subscriptionId={view.subscription.id} />
            {canCancel && <CancelSubscriptionDialog subscriptionId={view.subscription.id} />}
          </div>
        </CardContent>
      </Card>
    );
  }

  // EXPIRED_READ_ONLY
  return (
    <Card>
      <CardContent>
        <EmptyState
          title="Tu prueba terminó y no tenés una suscripción activa."
          description="Tus datos siguen ahí, intactos. Podés seguir viéndolos, pero para registrar nuevos movimientos, cuentas o usar la IA necesitás reactivar Pro (USD 7.99/mes)."
          action={
            <div className="flex flex-col items-center gap-2">
              <SubscribeButton />
              {view.subscription?.status === "CANCELLED" && (
                <p className="text-sm text-muted-foreground">Tu suscripción anterior fue cancelada{view.subscription.cancelledAt ? ` el ${formatDate(view.subscription.cancelledAt)}` : ""}.</p>
              )}
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}

function UsageSection({ view }: { view: BillingPageView }) {
  return (
    <section aria-labelledby="usage-title" className="mt-6">
      <div className="mb-3">
        <p className="text-sm text-muted-foreground">Plan y uso</p>
        <h2 id="usage-title" className="text-h3 text-foreground">Créditos de IA</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">IA</p>
            {view.ai.state === "ACCESS_REQUIRED" ? (
              <p className="text-h2 text-foreground">La IA está disponible con Pro.</p>
            ) : (
              <>
                <p className="text-h2 text-foreground">{view.ai.available} de {view.ai.total} disponibles</p>
                <p className="text-sm text-muted-foreground">{view.ai.state === "TRIAL" ? "Expiran al finalizar tu prueba." : `Se renuevan el ${view.ai.renewsAt ? formatDate(view.ai.renewsAt) : "próximo período"}.`}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">WhatsApp</p>
            {view.access === "EXPIRED_READ_ONLY" ? (
              <p className="text-h2 text-foreground">Disponible con Pro.</p>
            ) : (
              <p className="text-h2 text-foreground">{view.whatsappTotal} por {view.access === "TRIAL" ? "prueba" : "período"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function PaymentHistory({ payments }: { payments: BillingPageView["payments"] }) {
  if (payments.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="payments-title">
      <div className="mb-5 flex items-end justify-between border-b border-border pb-3"><div><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Historial</p><h2 id="payments-title">Pagos</h2></div></div>
      <div className="mt-10 rounded-lg border border-border bg-card">
        {payments.map((payment) => (
          <div className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={payment.id}>
            <div>
              <strong>{PAYMENT_STATUS_LABEL[payment.status]}</strong>
              <p>{payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}</p>
            </div>
            <strong><MoneyAmount amount={payment.grossAmount} currency={payment.currencyCode} /></strong>
          </div>
        ))}
      </div>
    </section>
  );
}

const PAYMENT_STATUS_LABEL: Record<BillingPageView["payments"][number]["status"], string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}
