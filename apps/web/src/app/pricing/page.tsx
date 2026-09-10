import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, MinusIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Planes y precios",
  description: "Empezá gratis. Pasate a Pro cuando quieras más IA, alertas por mail y WhatsApp.",
};

type Row = { label: string; free: string | boolean; pro: string | boolean };

const ROWS: Row[] = [
  { label: "Cuentas, movimientos, transferencias", free: "Ilimitado", pro: "Ilimitado" },
  { label: "Presupuestos, deudas y metas", free: "Ilimitado", pro: "Ilimitado" },
  { label: "Reportes y conversión al dólar blue", free: true, pro: true },
  { label: "KAI, tu asistente financiero", free: "150 consultas/mes", pro: "Ilimitado" },
  { label: "Análisis con IA de KAI (explicaciones, estrategias)", free: "Incluido (usa 5 consultas)", pro: "Ilimitado" },
  { label: "Categorización automática con IA", free: "Incluida en los créditos", pro: true },
  { label: "Modelo de IA", free: "Rápido", pro: "Avanzado" },
  { label: "Escenarios y simulaciones con IA", free: false, pro: true },
  { label: "Alertas por correo (resúmenes, presupuestos, vencimientos)", free: false, pro: true },
  { label: "Alertas por WhatsApp", free: false, pro: true },
  { label: "Notificaciones en la app y en vivo", free: true, pro: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <CheckIcon className="mx-auto size-4 text-brand" aria-label="Incluido" />;
  if (value === false) return <MinusIcon className="mx-auto size-4 text-muted-foreground" aria-label="No incluido" />;
  return <span className="text-caption text-muted-foreground">{value}</span>;
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿El plan gratis tiene fecha de vencimiento?",
    a: "No. Es permanente. Tenés todas las funciones de finanzas personales sin límite; lo único acotado es la cantidad de IA por mes.",
  },
  {
    q: "¿Qué pasa cuando se me acaban los créditos de IA del mes?",
    a: "El asistente te avisa y se reactiva al mes siguiente. Podés pasarte a Pro para tener muchos más al instante.",
  },
  {
    q: "¿Puedo probar Pro antes de pagar?",
    a: "Sí, tenés 14 días de Pro completo sin tarjeta. Al terminar seguís con el plan gratis, sin perder ningún dato.",
  },
  {
    q: "¿Cómo se cobra y puedo cancelar?",
    a: "El pago es mensual por Mercado Pago y podés cancelar cuando quieras desde Configuración → Plan. Al cancelar seguís con el plan gratis.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-16 bg-background px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-h1 text-foreground">Planes y precios</h1>
        <p className="max-w-xl text-body text-muted-foreground">
          Empezá gratis con tus finanzas completas. Pasate a Pro cuando quieras más IA y alertas por correo y WhatsApp.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-border p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 font-bold text-foreground">Gratis</h2>
            <p className="text-caption text-muted-foreground">Para ordenar tu plata sin pagar nada.</p>
          </div>
          <p className="text-h1 text-foreground">
            $0 <span className="text-body font-normal text-muted-foreground">/ mes</span>
          </p>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-body font-medium text-foreground transition-colors hover:bg-muted"
          >
            Empezá gratis
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border-2 border-brand p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 font-bold text-foreground">Pro</h2>
            <p className="text-caption text-muted-foreground">IA sin vueltas y alertas donde estés.</p>
          </div>
          <p className="text-h1 text-foreground">
            AR$ 8.999 <span className="text-body font-normal text-muted-foreground">/ mes</span>
          </p>
          <p className="text-caption text-muted-foreground">o AR$ 89.990 / año (2 meses gratis). Precios sujetos a actualización.</p>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-body font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Probar Pro 14 días gratis
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h3 font-bold text-foreground">Qué incluye cada plan</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-small font-medium text-muted-foreground">Función</th>
                <th className="px-4 py-3 text-center text-small font-medium text-foreground">Gratis</th>
                <th className="px-4 py-3 text-center text-small font-medium text-brand">Pro</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border/60">
                  <td className="py-3 pr-4 text-small text-foreground">{row.label}</td>
                  <td className="px-4 py-3 text-center">
                    <Cell value={row.free} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Cell value={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-h3 font-bold text-foreground">Preguntas frecuentes</h2>
        <dl className="grid gap-6 md:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.q} className="flex flex-col gap-1">
              <dt className="text-small font-bold text-foreground">{item.q}</dt>
              <dd className="text-caption text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="flex flex-col items-center gap-3 border-t border-border pt-10 text-center">
        <p className="text-body text-muted-foreground">¿Ya tenés cuenta?</p>
        <Link href="/app/settings/plan" className="text-body font-medium text-brand hover:underline">
          Gestioná tu plan
        </Link>
      </footer>
    </main>
  );
}
