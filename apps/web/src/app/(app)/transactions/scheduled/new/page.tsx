import { redirect } from "next/navigation";

// Consolidación 2026-09: programar un movimiento a futuro se hace desde Obligaciones.
export default function ScheduleNewPage() {
  redirect("/obligations/new");
}
