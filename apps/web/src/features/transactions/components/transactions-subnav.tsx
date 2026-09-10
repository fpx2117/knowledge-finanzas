"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// ADR-IMPL-001 + consolidación 2026-09: Transacciones pasó de 8 pestañas a 2. Gastos, Ingresos y
// Transferencias son chips dentro de Movimientos. Recurrentes y Duplicados son secciones dentro
// de Pendientes (#recurrentes / #duplicados). Programados vive en Obligaciones. Rutas viejas
// redirigen. Crear una transferencia se hace desde el botón "Transferir" del header (modal).
const TABS = [
  { label: "Movimientos", href: "/transactions" },
  { label: "Pendientes", href: "/transactions/pending" },
];

export function TransactionsSubnav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de transacciones" className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const href = tab.href.split("#")[0];
        const active = href === "/transactions" ? pathname === "/transactions" : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-small transition-colors",
              active ? "border-brand font-medium text-brand" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
