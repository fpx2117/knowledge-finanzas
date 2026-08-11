import { createBillingPlanRepository, db } from "@know-finanzas/db";
import { PRO_MONTHLY_PLAN_CODE } from "@know-finanzas/billing";
import { MoneyAmount } from "@/components/financial/money-amount";
import { SubscribeButton } from "@/features/billing/components/subscribe-button";

// Forces this page to render per-request rather than being statically prerendered at build time
// (TASK-039): a static build would freeze whatever plan price/availability existed the moment
// `next build` ran, and would require a reachable database during the Docker build step just to
// answer a query whose real answer can only change at request time anyway.
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plan = await createBillingPlanRepository(db).findActiveByCode(PRO_MONTHLY_PLAN_CODE);

  return (
    <main className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Planes</p>
          <h1>Know Finanzas Pro</h1>
          <p className="lede">Desbloqueá el control financiero completo con un solo plan mensual, sin sorpresas.</p>
        </div>
      </header>

      {!plan ? (
        <section className="accounts-empty" role="status">
          <h2>Todavía no hay un plan disponible.</h2>
          <p>Volvé a intentarlo más tarde.</p>
        </section>
      ) : (
        <section className="detail-card pricing-card">
          <p className="card-label">{plan.name}</p>
          <p className="detail-value"><MoneyAmount amount={plan.price} currency={plan.currencyCode} /> <span className="pricing-interval">/ mes</span></p>
          <p className="card-helper">Facturación mensual recurrente vía Mercado Pago. Podés cancelar cuando quieras.</p>
          <div className="pricing-actions">
            <SubscribeButton />
          </div>
        </section>
      )}
    </main>
  );
}
