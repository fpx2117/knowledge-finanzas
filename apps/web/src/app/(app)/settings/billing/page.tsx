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
    <>
      <div className="settings-kicker"><span>Configuración</span><span aria-hidden="true">/</span><span>Suscripción</span></div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Tu plan</p>
          <h1>Suscripción y uso</h1>
          <p className="lede">Revisá tu acceso, tus créditos de IA y tu historial de pagos.</p>
        </div>
      </header>

      <StateBanner view={view} />
      {(view.accessSource === "TRIAL" || view.accessSource === "NONE") && <RedeemPromotionCodeForm />}
      <UsageSection view={view} />
      <PaymentHistory payments={view.payments} />
    </>
  );
}

function StateBanner({ view }: { view: BillingPageView }) {
  if (view.accessSource === "PROMOTION" && view.promotion) {
    return (
      <section className="detail-card pricing-card" role="status">
        <p className="card-label">Pro promocional</p>
        <p className="detail-value">Acceso Pro hasta el {formatDate(view.promotion.endsAt)}</p>
        <p className="card-helper">
          Este acceso es promocional, no una suscripción paga — no se te va a cobrar nada al vencer. Podés suscribirte
          en cualquier momento para conservar el acceso Pro después.
        </p>
        <div className="pricing-actions"><SubscribeButton /></div>
      </section>
    );
  }

  if (view.access === "TRIAL") {
    return (
      <section className="detail-card pricing-card">
        <p className="card-label">Prueba gratuita</p>
        <p className="detail-value">{view.trial?.daysRemaining ?? 0} días restantes</p>
        <p className="card-helper">Después de la prueba, Know Finanzas Pro cuesta USD 7.99 por mes. No pedimos tarjeta hasta que decidas suscribirte.</p>
        <div className="pricing-actions"><SubscribeButton /></div>
      </section>
    );
  }

  if (view.access === "PRO" && view.subscription) {
    const canCancel = CANCELLABLE_STATUSES.has(view.subscription.status);
    return (
      <section className="detail-card pricing-card">
        <p className="card-label">{view.subscription.plan?.name ?? "Know Finanzas Pro"}</p>
        <p className="detail-value">{view.subscription.plan && <MoneyAmount amount={view.subscription.plan.price} currency={view.subscription.plan.currencyCode} />} <span className="pricing-interval">/ mes</span></p>
        {view.subscription.status === "PAST_DUE" ? (
          <p className="card-helper">Tu último pago no se pudo procesar. Mercado Pago va a reintentarlo; si no se resuelve, tu acceso Pro va a pasar a solo lectura.</p>
        ) : (
          <p className="card-helper">{view.subscription.currentPeriodEnd ? <>Se renueva el {formatDate(view.subscription.currentPeriodEnd)}.</> : "Suscripción activa."}</p>
        )}
        <div className="pricing-actions header-actions">
          <RefreshSubscriptionButton subscriptionId={view.subscription.id} />
          {canCancel && <CancelSubscriptionDialog subscriptionId={view.subscription.id} />}
        </div>
      </section>
    );
  }

  // EXPIRED_READ_ONLY
  return (
    <section className="accounts-empty" role="status">
      <h2>Tu prueba terminó y no tenés una suscripción activa.</h2>
      <p>
        Tus datos siguen ahí, intactos. Podés seguir viéndolos, pero para registrar nuevos movimientos, cuentas o
        usar la IA necesitás reactivar Pro (USD 7.99/mes).
      </p>
      <SubscribeButton />
      {view.subscription?.status === "CANCELLED" && <p className="card-helper">Tu suscripción anterior fue cancelada{view.subscription.cancelledAt ? ` el ${formatDate(view.subscription.cancelledAt)}` : ""}.</p>}
    </section>
  );
}

function UsageSection({ view }: { view: BillingPageView }) {
  return (
    <section className="dashboard-section" aria-labelledby="usage-title">
      <div className="dashboard-section-heading"><div><p className="card-label">Plan y uso</p><h2 id="usage-title">Créditos de IA</h2></div></div>
      <div className="metric-grid">
        <article className="metric-card">
          <p className="card-label">IA</p>
          {view.ai.state === "ACCESS_REQUIRED" ? (
            <p className="metric-value">La IA está disponible con Pro.</p>
          ) : (
            <>
              <p className="metric-value">{view.ai.available} de {view.ai.total} disponibles</p>
              <p className="card-helper">{view.ai.state === "TRIAL" ? "Expiran al finalizar tu prueba." : `Se renuevan el ${view.ai.renewsAt ? formatDate(view.ai.renewsAt) : "próximo período"}.`}</p>
            </>
          )}
        </article>
        <article className="metric-card">
          <p className="card-label">WhatsApp</p>
          {view.access === "EXPIRED_READ_ONLY" ? (
            <p className="metric-value">Disponible con Pro.</p>
          ) : (
            <p className="metric-value">{view.whatsappTotal} por {view.access === "TRIAL" ? "prueba" : "período"}</p>
          )}
        </article>
      </div>
    </section>
  );
}

function PaymentHistory({ payments }: { payments: BillingPageView["payments"] }) {
  if (payments.length === 0) return null;

  return (
    <section className="dashboard-section" aria-labelledby="payments-title">
      <div className="dashboard-section-heading"><div><p className="card-label">Historial</p><h2 id="payments-title">Pagos</h2></div></div>
      <div className="transaction-list">
        {payments.map((payment) => (
          <div className="transaction-row" key={payment.id}>
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
