"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "Movimientos", href: "/transactions" },
  { label: "Pendientes", href: "/transactions/pendientes" },
  { label: "Recurrentes", href: "/transactions/recurrentes" },
  { label: "Importaciones", href: "/transactions/importaciones" },
  { label: "Duplicados", href: "/transactions/duplicados" },
];

export function TransactionsSubnav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de transacciones" className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = tab.href === "/transactions" ? pathname === "/transactions" : pathname.startsWith(tab.href);
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
