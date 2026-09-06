import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusChip, type ChipTone } from "@/components/shared/status-chip";
import { HelpShell } from "@/features/help/components/help-shell";

// spec 12 §15 — sin backend de status todavía; se muestra el principio de degradación (§15.4):
// una falla de IA / analytics / notificaciones nunca bloquea el núcleo financiero.
const COMPONENTS: Array<{ name: string; state: string; tone: ChipTone }> = [
  { name: "Aplicación web", state: "Operativa", tone: "positive" },
  { name: "Registro de movimientos", state: "Operativo", tone: "positive" },
  { name: "Importaciones", state: "Operativas", tone: "positive" },
  { name: "IA (explicaciones, sugerencias)", state: "Sin monitoreo en vivo", tone: "neutral" },
  { name: "Notificaciones", state: "Operativas", tone: "positive" },
];

export default function ServiceStatusPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Estado del servicio" description="Cómo están funcionando las partes de KnowFinanzas." />
      <HelpShell active="status">
        <div className="flex flex-col gap-6">
          <SectionCard title="Componentes">
            <ul className="flex flex-col divide-y divide-border">
              {COMPONENTS.map((component) => (
                <li key={component.name} className="flex items-center justify-between gap-3 py-2.5 text-small first:pt-0 last:pb-0">
                  <span className="text-foreground">{component.name}</span>
                  <StatusChip tone={component.tone}>{component.state}</StatusChip>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-caption text-muted-foreground">
              Todavía no tenemos una página de estado en vivo. Si la IA, las notificaciones o las analíticas fallan, el registro de
              movimientos, los saldos y los reportes siguen funcionando.
            </p>
          </SectionCard>
        </div>
      </HelpShell>
    </div>
  );
}
