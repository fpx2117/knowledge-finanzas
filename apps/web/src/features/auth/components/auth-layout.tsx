import Image from "next/image";
import Link from "next/link";

/**
 * Auth screens — visual-design-personal.md §18: a quiet financial workspace with
 * the form as the focal point. Atmospheric brand imagery is allowed here (hero),
 * kept subtle: a soft blue wash, no dense data behind it.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-subtle p-12 lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 size-[28rem] rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-0 size-72 rounded-full bg-primary/10 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <Image src="/brand/logo.png" alt="" width={32} height={32} className="size-8 object-contain" />
          <span className="text-h3 tracking-tight text-foreground">
            Know<span className="text-brand">Finanzas</span>
          </span>
        </Link>
        <div className="relative flex flex-col gap-4">
          <p className="text-caption font-semibold uppercase tracking-wider text-brand">Control financiero personal</p>
          <h2 className="text-balance text-h1 text-foreground">Tu situación financiera, hecha entendible.</h2>
          <p className="max-w-md text-body text-foreground-secondary">
            Entendé qué tenés, qué debés, qué vence y cuánto podés gastar realmente — con información clara y siempre a tu alcance.
          </p>
        </div>
        <p className="relative text-caption text-muted-foreground">Tus datos están protegidos y son solo tuyos.</p>
      </aside>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <Image src="/brand/logo.png" alt="" width={28} height={28} className="size-7 object-contain" />
            <span className="text-body-lg font-medium tracking-tight text-foreground">
              Know<span className="text-brand">Finanzas</span>
            </span>
          </Link>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-h2 text-foreground">{title}</h1>
            <p className="text-body text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          <p className="text-center text-small text-muted-foreground">{footer}</p>
        </div>
      </section>
    </main>
  );
}
