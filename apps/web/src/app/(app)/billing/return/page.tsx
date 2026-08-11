import Link from "next/link";

export default function BillingReturnPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Suscripción</p>
          <h1>Estamos confirmando tu suscripción.</h1>
          <p className="lede">
            Mercado Pago todavía tiene que confirmarnos el pago. Esto puede tardar unos minutos y no depende de esta página:
            tu cuenta pasará a Pro automáticamente en cuanto la confirmación llegue.
          </p>
        </div>
      </header>

      <section className="accounts-empty" role="status">
        <h2>Tu suscripción está pendiente de confirmación.</h2>
        <p>Todavía no está activa. No hace falta que hagas nada más: te avisaremos cuando se confirme.</p>
        <Link className="secondary-button" href="/dashboard">Volver al dashboard</Link>
      </section>
    </>
  );
}
