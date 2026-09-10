import { redirect } from "next/navigation";

// Consolidación 2026-09: "Recurrentes" dejó de ser una pestaña — los cargos detectados que se
// repiten se revisan en Pendientes (sección #recurrentes), junto al resto de lo que necesita tu
// decisión. Las suscripciones confirmadas viven en Obligaciones.
export default function RecurringPage() {
  redirect("/transactions/pending#recurrentes");
}
