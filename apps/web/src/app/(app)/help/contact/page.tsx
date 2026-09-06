import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { HelpShell } from "@/features/help/components/help-shell";

// spec 12 §16 — escalar un problema manteniendo el contexto. Sin backend de tickets todavía:
// se da el canal directo y qué incluir.
export default function ContactSupportPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Contactar soporte" description="Cuando el diagnóstico no alcanza, escribinos." />
      <HelpShell active="contact">
        <div className="flex flex-col gap-6">
          <SectionCard title="Escribinos">
            <p className="text-small text-muted-foreground">
              Todavía no tenemos un formulario de soporte dentro de la app. Mandanos un correo a{" "}
              <a href="mailto:soporte@knowfinanzas.com" className="font-medium text-brand hover:underline">
                soporte@knowfinanzas.com
              </a>{" "}
              y respondemos lo antes posible.
            </p>
          </SectionCard>
          <SectionCard title="Qué incluir">
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-small text-muted-foreground">
              <li>Qué esperabas ver y qué viste.</li>
              <li>El módulo y la fecha del movimiento u obligación, si aplica.</li>
              <li>Si ya pasaste por &ldquo;Resolver un problema&rdquo; y qué te dijo el diagnóstico.</li>
              <li>Nunca hace falta que nos mandes contraseñas ni datos de tu tarjeta.</li>
            </ul>
          </SectionCard>
        </div>
      </HelpShell>
    </div>
  );
}
