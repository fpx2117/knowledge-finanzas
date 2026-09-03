import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { getAdminAggregateAnalyticsSummary } from "@/lib/admin/get-admin-aggregate-analytics-summary.instance";

export default async function AdminAnalyticsPage() {
  await requireAdminUser("commercial.users.read");
  const summary = await getAdminAggregateAnalyticsSummary();

  return (
    <section>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analítica y datos</p>
      <h2>Resumen agregado</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Solo conteos y agregados — nunca un explorador por usuario. Las cohortes por debajo del umbral de supresión
        nunca muestran sus valores estadísticos, ni siquiera acá.
      </p>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" style={{ marginTop: 24 }}>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuarios totales</p>
          <p className="text-2xl tracking-tight">{summary.totalUsers}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consentimiento · analítica de producto</p>
          <p className="text-2xl tracking-tight">{summary.consentedProductAnalytics}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consentimiento · estadísticas externas</p>
          <p className="text-2xl tracking-tight">{summary.consentedExternalAggregatedStatistics}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perfiles con algún dato</p>
          <p className="text-2xl tracking-tight">{summary.profileCompletionCount}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Último período generado</p>
          <p className="text-2xl tracking-tight">{summary.latestPeriod ?? "—"}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cohortes (último período)</p>
          <p className="text-2xl tracking-tight">{summary.totalCohortCount}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cohortes suprimidas</p>
          <p className="text-2xl tracking-tight">{summary.suppressedCohortCount}</p>
        </article>
      </div>
    </section>
  );
}
