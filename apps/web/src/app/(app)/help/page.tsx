import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { HelpShell, HELP_SECTIONS } from "@/features/help/components/help-shell";

// spec 12 §5.3 — artículos destacados iniciales (contenido estático, sin CMS todavía).
const FEATURED = [
  { title: "¿Qué es el dinero disponible?", body: "Es tu saldo confirmado menos las obligaciones comprometidas de los próximos 30 días. No incluye ingresos futuros.", href: "/app" },
  { title: "¿Por qué un pago de deuda no aparece como gasto?", body: "Una obligación futura ya reduce tu dinero disponible. Cuando la pagás, la salida real reemplaza ese compromiso — nunca se descuentan las dos cosas.", href: "/obligations" },
  { title: "¿Por qué no se suman mis cuentas en pesos y en dólares?", body: "KnowFinanzas nunca combina monedas sin una conversión explícita. Cada moneda se muestra por separado.", href: "/accounts" },
];

export default function HelpHomePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Centro de ayuda" description="Encontrá una explicación, resolvé un problema o escribinos." />
      <HelpShell>
        <div className="flex flex-col gap-6">
          <SectionCard title="Empezá por acá">
            <ul className="flex flex-col divide-y divide-border">
              {HELP_SECTIONS.map((section) => (
                <li key={section.key}>
                  <Link href={section.href} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-brand">
                    <span className="flex items-center gap-2.5 text-small font-medium text-foreground">
                      <section.icon className="size-4 text-muted-foreground" />
                      {section.label}
                    </span>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Preguntas frecuentes">
            <ul className="flex flex-col gap-4">
              {FEATURED.map((article) => (
                <li key={article.title} className="flex flex-col gap-1">
                  <Link href={article.href} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                    {article.title}
                  </Link>
                  <p className="text-small text-muted-foreground">{article.body}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </HelpShell>
    </div>
  );
}
