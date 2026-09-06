import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { HelpShell } from "@/features/help/components/help-shell";

// spec 12 §2.2 — "Acerca de KnowFinanzas".
const PRINCIPLES = [
  "El saldo real siempre se deriva de tus movimientos confirmados — nunca se edita a mano.",
  "El dinero disponible descuenta tus compromisos próximos; los ingresos futuros no cuentan hasta que ocurren.",
  "Las transferencias entre tus cuentas no son ingreso ni gasto.",
  "Nunca sumamos monedas distintas sin una conversión explícita.",
  "Las proyecciones son estimaciones reconstruibles, siempre separadas de la realidad confirmada.",
  "La IA explica y sugiere; nunca decide ni modifica tus datos.",
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Acerca de KnowFinanzas" description="Un sistema personal de control financiero, no una app de gastos ni una copia del homebanking." />
      <HelpShell active="about">
        <SectionCard title="Cómo tratamos tu dinero">
          <ul className="flex list-disc flex-col gap-2 pl-4 text-small text-muted-foreground">
            {PRINCIPLES.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>
        </SectionCard>
      </HelpShell>
    </div>
  );
}
