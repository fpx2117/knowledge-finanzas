import { redirect } from "next/navigation";

// Consolidación 2026-09: los movimientos a futuro se gestionan en Obligaciones, que ya unifica
// deuda + suscripción + programado en una sola vista temporal.
export default function ScheduledPage() {
  redirect("/obligations");
}
