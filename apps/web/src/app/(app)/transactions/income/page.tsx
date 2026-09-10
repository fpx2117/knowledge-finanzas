import { redirect } from "next/navigation";

// Consolidación 2026-09: "Ingresos" dejó de ser una pestaña propia — es un chip / filtro dentro
// de Movimientos. Se mantiene la ruta como redirect para no romper enlaces existentes.
export default function IncomePage() {
  redirect("/transactions?type=INCOME");
}
