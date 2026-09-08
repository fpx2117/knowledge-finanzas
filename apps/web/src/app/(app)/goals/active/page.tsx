import { redirect } from "next/navigation";

// spec 07 §8.2 — "Activas" es una pestaña de /goals, no una ruta aparte. Se mantiene el redirect
// para enlaces guardados.
export default function ActiveGoalsPage() {
  redirect("/goals?status=activas");
}
