import Link from "next/link";
import { AlertTriangleIcon, ArrowRightIcon, CopyIcon, CreditCardIcon, RepeatIcon, UploadIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { inboxService } from "@/features/transactions/services/inbox-service.instance";
import { InboxUncategorized } from "@/features/transactions/components/inbox-uncategorized";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function InboxPage() {
  const user = await requireCurrentUser();
  const summary = await inboxService.getSummary(user.id);

  const links: Array<{ icon: React.ReactNode; label: string; count: number | null; href: string }> = [
    { icon: <RepeatIcon className="size-4" />, label: "Gastos recurrentes", count: summary.recurringSuggestions, href: "/recurrentes" },
    { icon: <CreditCardIcon className="size-4" />, label: "Suscripciones", count: summary.activeSubscriptions, href: "/suscripciones" },
    { icon: <CopyIcon className="size-4" />, label: "Posibles duplicados", count: summary.duplicatePairs, href: "/duplicados" },
    { icon: <UploadIcon className="size-4" />, label: "Importar movimientos", count: null, href: "/importar" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Bandeja"
        description={
          summary.total === 0
            ? "Estás al día — no hay nada pendiente de revisar."
            : `${summary.total} ${summary.total === 1 ? "cosa" : "cosas"} para revisar.`
        }
      />

      {summary.priceIncreases.length > 0 ? (
        <SectionCard title="Aumentos de precio" eyebrow={`${summary.priceIncreases.length}`}>
          <ul className="flex flex-col gap-1.5">
            {summary.priceIncreases.map((p) => (
              <li key={p.label} className="flex items-center gap-2 text-small">
                <AlertTriangleIcon className="size-4 shrink-0 text-[var(--warning)]" />
                <span className="text-foreground">{p.label}</span>
                <span className="text-muted-foreground">
                  {money(Number(p.from), p.currencyCode)} → {money(Number(p.to), p.currencyCode)} · +{money(p.yearlyImpact, p.currencyCode)}/año
                </span>
              </li>
            ))}
          </ul>
          <Link href="/suscripciones" className="mt-3 inline-flex items-center gap-1 text-small font-medium text-brand hover:underline">
            Ver suscripciones <ArrowRightIcon className="size-3.5" />
          </Link>
        </SectionCard>
      ) : null}

      <SectionCard title="Sin categoría" eyebrow={`${summary.uncategorized.count}`}>
        {summary.uncategorized.items.length > 0 ? (
          <InboxUncategorized items={summary.uncategorized.items} categories={summary.categoryOptions} />
        ) : (
          <p className="py-4 text-center text-small text-muted-foreground">Todos tus gastos tienen categoría.</p>
        )}
      </SectionCard>

      <SectionCard title="Herramientas">
        <ul className="flex flex-col divide-y divide-border">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                <span className="flex items-center gap-2 text-small text-foreground">
                  {link.icon} {link.label}
                </span>
                <span className="flex items-center gap-2 text-caption text-muted-foreground">
                  {link.count && link.count > 0 ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">{link.count}</span>
                  ) : null}
                  <ArrowRightIcon className="size-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
