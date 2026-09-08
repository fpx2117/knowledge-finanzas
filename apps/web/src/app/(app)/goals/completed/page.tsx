import { redirect } from "next/navigation";

// spec 07 §8.2 — "Completadas" es una pestaña de /goals, no una ruta aparte. Se mantiene el
// redirect para enlaces guardados.
export default function CompletedGoalsPage() {
  redirect("/goals?status=completadas");
}
