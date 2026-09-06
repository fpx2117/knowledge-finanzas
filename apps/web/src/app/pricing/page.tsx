import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-h1 text-foreground">Planes y precios</h1>
      <p className="max-w-md text-body text-muted-foreground">
        Estamos actualizando esta página. Mientras tanto, podés gestionar tu suscripción desde la app.
      </p>
      <Link href="/app" className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-body font-medium text-primary-foreground transition-colors hover:opacity-90">
        Ir a la app
      </Link>
    </main>
  );
}
