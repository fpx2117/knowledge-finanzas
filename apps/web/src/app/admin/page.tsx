import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { getCommercialOverviewMetrics } from "@/lib/admin/get-commercial-overview-metrics.instance";
import { getProductFunnelMetrics } from "@/lib/admin/get-product-funnel-metrics.instance";
import { MoneyAmount } from "@/components/financial/money-amount";

export default async function AdminOverviewPage() {
  const admin = await requireAdminUser();
  const [metrics, funnel] = await Promise.all([getCommercialOverviewMetrics(), getProductFunnelMetrics()]);

  return (
    <section>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumen comercial</p>
      <h2>Bienvenido, {admin.email}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Rol: {admin.role}. Prioriza las colas accionables antes que las métricas de vanidad.</p>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" style={{ marginTop: 24 }}>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pro activo</p>
          <p className="text-2xl tracking-tight">{metrics.activePro}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pruebas activas</p>
          <p className="text-2xl tracking-tight">{metrics.activeTrials}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solo lectura (vencidos)</p>
          <p className="text-2xl tracking-tight">{metrics.expiredReadOnly}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pro promocional</p>
          <p className="text-2xl tracking-tight">{metrics.promoPro}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">MRR</p>
           <p className="text-2xl tracking-tight">{metrics.mrr ? <MoneyAmount amount={metrics.mrr.amount} currency={metrics.mrr.currencyCode} variant="balance" /> : "—"}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pagos atrasados</p>
          <p className="text-2xl tracking-tight">{metrics.pastDue}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reembolsos pendientes</p>
          <p className="text-2xl tracking-tight">{metrics.refundsPending}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhooks fallidos</p>
          <p className="text-2xl tracking-tight">{metrics.failedWebhooks}</p>
        </article>
      </div>

      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ marginTop: 32 }}>Embudo de producto</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Conteos de eventos de analítica (packages/analytics), no de facturación — la conversión a Pro mostrada acá viene
        del evento subscription_activated, disparado únicamente por una transición real de estado de billing.
      </p>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" style={{ marginTop: 12 }}>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registros</p>
          <p className="text-2xl tracking-tight">{funnel.signups}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prueba iniciada</p>
          <p className="text-2xl tracking-tight">{funnel.trialStarted}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activados</p>
          <p className="text-2xl tracking-tight">{funnel.activated}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Checkout iniciado</p>
          <p className="text-2xl tracking-tight">{funnel.checkoutStarted}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversión a Pro</p>
          <p className="text-2xl tracking-tight">{funnel.subscriptionActivated}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adopción de IA</p>
          <p className="text-2xl tracking-tight">{funnel.aiAdoption}</p>
        </article>
      </div>
    </section>
  );
}
