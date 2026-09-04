import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-caption font-semibold uppercase tracking-wider text-primary">Error 404</p>
      <h1 className="text-h1 text-foreground">Esta página no existe</h1>
      <p className="max-w-md text-body text-muted-foreground">
        El enlace que seguiste puede estar roto o la página se movió.
      </p>
      <Link
        href="/app"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-body font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        Volver al resumen
      </Link>
    </main>
  );
}
