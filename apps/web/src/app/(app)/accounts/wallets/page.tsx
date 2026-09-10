import { redirect } from "next/navigation";

// Consolidación 2026-09: "wallets" dejó de ser una subvista propia — el filtro por tipo vive dentro
// de la card "Tus cuentas" en /accounts. Se mantiene la ruta como redirect.
export default function Page() {
  redirect("/accounts");
}
