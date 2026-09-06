import Link from "next/link";
import { CheckCircle2Icon, SearchCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createHelpService } from "@/features/help/services/help-service";
import { HelpShell } from "@/features/help/components/help-shell";

const service = createHelpService();

// spec 12 §10.2 — un árbol de diagnóstico simple, no una lista interminable de FAQs.
const PROBLEMS = [
  { key: "balance", label: "Mi saldo no coincide", active: true },
  { key: "duplicate", label: "Veo un movimiento duplicado", href: "/transactions/pending#duplicados" },
  { key: "transfer", label: "Una transferencia aparece mal", href: "/transactions/transfers" },
  { key: "import", label: "Una importación falló", href: "/settings/imports" },
  { key: "category", label: "Una categoría no es correcta", href: "/settings/rules" },
  { key: "budget", label: "Mi presupuesto no coincide", href: "/budgets" },
  { key: "obligation", label: "Una obligación aparece dos veces", href: "/obligations" },
  { key: "projection", label: "Mi proyección parece incorrecta", href: "/reports/cash-flow" },
];

export default async function TroubleshootPage({ searchParams }: { searchParams: Promise<{ problem?: string }> }) {
  const { problem } = await searchParams;
  const user = await requireCurrentUser();
  const showBalance = problem === "balance" || problem === undefined;
  const findings = showBalance ? await service.diagnoseBalance(user) : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Resolver un problema" description="Elegí qué está pasando y revisamos las causas más comunes — sin tocar tus datos." />
      <HelpShell active="troubleshoot">
        <div className="flex flex-col gap-6">
          <SectionCard title="¿Qué problema estás teniendo?">
            <ul className="flex flex-col divide-y divide-border">
              {PROBLEMS.map((p) => (
                <li key={p.key}>
                  <Link
                    href={p.active ? "/help/troubleshoot?problem=balance" : p.href ?? "/help/troubleshoot"}
                    aria-current={showBalance && p.key === "balance" ? "true" : undefined}
                    className="flex items-center justify-between gap-3 py-2.5 text-small first:pt-0 last:pb-0 hover:text-brand"
                  >
                    <span className={showBalance && p.key === "balance" ? "font-medium text-foreground" : "text-foreground"}>{p.label}</span>
                    <span className="text-caption text-muted-foreground">{p.active ? "Diagnóstico" : "Ir a la sección"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          {showBalance ? (
            <SectionCard
              title="Diagnóstico de saldo"
              eyebrow="Read-only — no corrige nada"
              info="Revisamos causas comunes de una diferencia de saldo. Ninguna acción se ejecuta automáticamente (spec 12 §11.4)."
            >
              <p className="text-small text-muted-foreground">
                Un saldo que no cuadra casi siempre tiene una de estas causas. Revisá cada una — el saldo real siempre se deriva de tus
                movimientos confirmados.
              </p>

              {findings.length === 0 ? (
                <div className="mt-3 flex items-start gap-3 rounded-lg border border-success-soft bg-success-soft/40 p-3">
                  <CheckCircle2Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-[var(--success)]" />
                  <div className="flex flex-col gap-0.5 text-small">
                    <span className="font-medium text-foreground">No encontramos causas evidentes</span>
                    <span className="text-muted-foreground">
                      No hay pendientes de revisión, ajustes recientes, movimientos con fecha futura ni cuentas multimoneda que expliquen una
                      diferencia. Si el banco incluye movimientos que todavía no registraste, esa puede ser la causa.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  <p className="flex items-center gap-2 text-small font-medium text-foreground">
                    <SearchCheckIcon className="size-4 text-brand" />
                    Encontramos {findings.length} {findings.length === 1 ? "posible causa" : "posibles causas"}
                  </p>
                  <ol className="flex flex-col gap-3">
                    {findings.map((finding, index) => (
                      <li key={finding.key} className="rounded-lg border border-border bg-surface-secondary p-3">
                        <p className="text-small font-medium text-foreground">
                          {index + 1}. {finding.title}
                        </p>
                        <p className="mt-0.5 text-small text-muted-foreground">{finding.detail}</p>
                        {finding.cta ? (
                          <Link href={finding.cta.href} className="mt-1.5 inline-block text-small font-medium text-brand hover:underline">
                            {finding.cta.label}
                          </Link>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </SectionCard>
          ) : null}
        </div>
      </HelpShell>
    </div>
  );
}
