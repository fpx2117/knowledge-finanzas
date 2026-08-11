import { TrialCtaForm } from "./trial-cta-form";
import { ProCheckoutForm } from "./pro-checkout-form";
import { PromoCodeForm } from "./promo-code-form";

export type AccessSelectionCatalog = {
  trial: { durationDays: number; aiCreditsTotal: number; whatsappTotal: number };
  pro: { price: string; currencyCode: string; aiCreditsPerPeriod: number; whatsappPerPeriod: number };
};

// Renders every benefit number from `catalog`, sourced by the page from env/plan config — never
// hardcoded here separately (Implementation Notes: "a single source ... never hardcoding benefit
// numbers separately in the UI").
export function AccessSelectionView({ catalog }: { catalog: AccessSelectionCatalog }) {
  return (
    <section className="detail-card">
      <p className="card-label">Elegí cómo comenzar</p>
      <h1>Todavía no tenés acceso activo.</h1>
      <p className="lede">Elegí una prueba gratuita por tiempo limitado, o empezá directamente con Pro.</p>

      <div className="detail-grid">
        <article className="detail-card">
          <p className="card-label">Prueba gratuita</p>
          <h2>{catalog.trial.durationDays} días, sin tarjeta</h2>
          <ul>
            <li>Todas las funciones habilitadas</li>
            <li>{catalog.trial.aiCreditsTotal} créditos de IA en total</li>
            <li>{catalog.trial.whatsappTotal} mensajes de WhatsApp en total</li>
            <li>Notificaciones en la app y por email</li>
          </ul>
          <TrialCtaForm />
        </article>

        <article className="detail-card">
          <p className="card-label">Pro</p>
          <h2>{catalog.pro.currencyCode} {catalog.pro.price} / mes</h2>
          <ul>
            <li>Todas las funciones habilitadas</li>
            <li>{catalog.pro.aiCreditsPerPeriod} créditos de IA por período</li>
            <li>{catalog.pro.whatsappPerPeriod} mensajes de WhatsApp por período</li>
            <li>Renovación mensual automática</li>
          </ul>
          <ProCheckoutForm />
        </article>
      </div>

      <PromoCodeForm />
    </section>
  );
}
