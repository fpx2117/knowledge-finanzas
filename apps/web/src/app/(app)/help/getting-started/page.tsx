import Link from "next/link";
import { CheckIcon, CircleIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createHelpService } from "@/features/help/services/help-service";
import { HelpShell } from "@/features/help/components/help-shell";

const service = createHelpService();

const GLOSSARY = [
  ["Cuenta", "Representa dónde está tu dinero."],
  ["Movimiento", "Una entrada, salida, devolución, ajuste o transferencia."],
  ["Obligación", "Un compromiso futuro que puede afectar cuánto dinero tenés disponible."],
  ["Presupuesto", "Te ayuda a limitar cuánto querés gastar por categoría."],
  ["Meta", "Un objetivo de ahorro — no una deuda ni un gasto."],
];

// spec 12 §9 — checklist reflejando estado real del producto, sin gamificación artificial.
export default async function GettingStartedPage() {
  const user = await requireCurrentUser();
  const checklist = await service.gettingStartedChecklist(user);
  const done = checklist.filter((item) => item.done).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Primeros pasos" description="Cómo sacarle valor a KnowFinanzas, paso a paso." />
      <HelpShell active="getting-started">
        <div className="flex flex-col gap-6">
          <SectionCard title="Tu progreso" eyebrow={`${done} de ${checklist.length}`}>
            <ProgressBar value={(done / checklist.length) * 100} state="normal" aria-label={`${done} de ${checklist.length} pasos completados`} />
            <ul className="mt-2 flex flex-col divide-y divide-border">
              {checklist.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className={
                        item.done
                          ? "flex size-5 items-center justify-center rounded-full bg-success-soft text-[var(--success)]"
                          : "flex size-5 items-center justify-center rounded-full text-muted-foreground"
                      }
                    >
                      {item.done ? <CheckIcon className="size-3.5" /> : <CircleIcon className="size-3.5" />}
                    </span>
                    <span className={item.done ? "text-small text-muted-foreground line-through" : "text-small text-foreground"}>{item.label}</span>
                  </span>
                  {!item.done ? (
                    <Link href={item.href} className="text-small font-medium text-brand hover:underline">
                      Hacerlo
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Los conceptos, en una línea">
            <dl className="flex flex-col gap-3">
              {GLOSSARY.map(([term, def]) => (
                <div key={term} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="text-small font-medium text-foreground sm:w-28 sm:shrink-0">{term}</dt>
                  <dd className="text-small text-muted-foreground">{def}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>
      </HelpShell>
    </div>
  );
}
