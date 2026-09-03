import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BillingReturnPage() {
  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Suscripción</p>
          <h1>Estamos confirmando tu suscripción.</h1>
          <p className="mt-4 max-w-[490px] text-body-lg leading-relaxed text-muted-foreground">
            Mercado Pago todavía tiene que confirmarnos el pago. Esto puede tardar unos minutos y no depende de esta página:
            tu cuenta pasará a Pro automáticamente en cuanto la confirmación llegue.
          </p>
        </div>
      </header>

      <section className="mt-10 max-w-[650px] rounded-lg border border-dashed border-border bg-card p-8" role="status">
        <h2>Tu suscripción está pendiente de confirmación.</h2>
        <p>Todavía no está activa. No hace falta que hagas nada más: te avisaremos cuando se confirme.</p>
        <Button variant="outline" render={<Link href="/dashboard" />}>Volver al dashboard</Button>
      </section>
    </>
  );
}
