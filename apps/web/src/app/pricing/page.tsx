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
    <main className="mx-auto w-full max-w-[1120px] px-6 py-12 lg:px-[6vw]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Planes</p>
          <h1>Know Finanzas Pro</h1>
          <p className="mt-4 max-w-[490px] text-body-lg leading-relaxed text-muted-foreground">Desbloqueá el control financiero completo con un solo plan mensual, sin sorpresas.</p>
        </div>
      </header>

      {!plan ? (
        <section className="mt-10 max-w-[650px] rounded-lg border border-dashed border-border bg-card p-8" role="status">
          <h2>Todavía no hay un plan disponible.</h2>
          <p>Volvé a intentarlo más tarde.</p>
        </section>
      ) : (
        <section className="mt-12 max-w-[420px] rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{plan.name}</p>
          <p className="text-2xl tracking-tight"><MoneyAmount amount={plan.price} currency={plan.currencyCode} /> <span className="pricing-interval">/ mes</span></p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Facturación mensual recurrente vía Mercado Pago. Podés cancelar cuando quieras.</p>
          <div className="pricing-actions">
            <SubscribeButton />
          </div>
        </section>
      )}
    </main>
  );
}
