import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { getCommercialOverviewMetrics } from "@/lib/admin/get-commercial-overview-metrics.instance";
import { getProductFunnelMetrics } from "@/lib/admin/get-product-funnel-metrics.instance";

export default async function AdminOverviewPage() {
  const admin = await requireAdminUser();
  const [metrics, funnel] = await Promise.all([getCommercialOverviewMetrics(), getProductFunnelMetrics()]);

  return (
    <section>
      <p className="card-label">Resumen comercial</p>
      <h2>Bienvenido, {admin.email}</h2>
      <p className="card-helper">Rol: {admin.role}. Prioriza las colas accionables antes que las métricas de vanidad.</p>

      <div className="admin-summary-grid" style={{ marginTop: 24 }}>
        <article className="detail-card">
          <p className="card-label">Pro activo</p>
          <p className="detail-value">{metrics.activePro}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Pruebas activas</p>
          <p className="detail-value">{metrics.activeTrials}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Solo lectura (vencidos)</p>
          <p className="detail-value">{metrics.expiredReadOnly}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Pro promocional</p>
          <p className="detail-value">{metrics.promoPro}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">MRR</p>
          <p className="detail-value">{metrics.mrr ? `${metrics.mrr.amount} ${metrics.mrr.currencyCode}` : "—"}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Pagos atrasados</p>
          <p className="detail-value">{metrics.pastDue}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Reembolsos pendientes</p>
          <p className="detail-value">{metrics.refundsPending}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Webhooks fallidos</p>
          <p className="detail-value">{metrics.failedWebhooks}</p>
        </article>
      </div>

      <p className="card-label" style={{ marginTop: 32 }}>Embudo de producto</p>
      <p className="card-helper">
        Conteos de eventos de analítica (packages/analytics), no de facturación — la conversión a Pro mostrada acá viene
        del evento subscription_activated, disparado únicamente por una transición real de estado de billing.
      </p>
      <div className="admin-summary-grid" style={{ marginTop: 12 }}>
        <article className="detail-card">
          <p className="card-label">Registros</p>
          <p className="detail-value">{funnel.signups}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Prueba iniciada</p>
          <p className="detail-value">{funnel.trialStarted}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Activados</p>
          <p className="detail-value">{funnel.activated}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Checkout iniciado</p>
          <p className="detail-value">{funnel.checkoutStarted}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Conversión a Pro</p>
          <p className="detail-value">{funnel.subscriptionActivated}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Adopción de IA</p>
          <p className="detail-value">{funnel.aiAdoption}</p>
        </article>
      </div>
    </section>
  );
}
