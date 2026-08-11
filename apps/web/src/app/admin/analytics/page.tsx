import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { getAdminAggregateAnalyticsSummary } from "@/lib/admin/get-admin-aggregate-analytics-summary.instance";

export default async function AdminAnalyticsPage() {
  await requireAdminUser("commercial.users.read");
  const summary = await getAdminAggregateAnalyticsSummary();

  return (
    <section>
      <p className="card-label">Analítica y datos</p>
      <h2>Resumen agregado</h2>
      <p className="card-helper">
        Solo conteos y agregados — nunca un explorador por usuario. Las cohortes por debajo del umbral de supresión
        nunca muestran sus valores estadísticos, ni siquiera acá.
      </p>

      <div className="admin-summary-grid" style={{ marginTop: 24 }}>
        <article className="detail-card">
          <p className="card-label">Usuarios totales</p>
          <p className="detail-value">{summary.totalUsers}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Consentimiento · analítica de producto</p>
          <p className="detail-value">{summary.consentedProductAnalytics}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Consentimiento · estadísticas externas</p>
          <p className="detail-value">{summary.consentedExternalAggregatedStatistics}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Perfiles con algún dato</p>
          <p className="detail-value">{summary.profileCompletionCount}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Último período generado</p>
          <p className="detail-value">{summary.latestPeriod ?? "—"}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Cohortes (último período)</p>
          <p className="detail-value">{summary.totalCohortCount}</p>
        </article>
        <article className="detail-card">
          <p className="card-label">Cohortes suprimidas</p>
          <p className="detail-value">{summary.suppressedCohortCount}</p>
        </article>
      </div>
    </section>
  );
}
