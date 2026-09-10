import { redirect } from "next/navigation";

// Consolidación 2026-09: las transferencias son un chip dentro de Movimientos, no una lista
// aparte. Para crear una: botón "Transferir" del header de Transacciones (modal).
export default function TransfersPage() {
  redirect("/transactions?type=TRANSFER");
}
