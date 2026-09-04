"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// ADR-IMPL-001: canonical English paths (spec 14 §8). Importaciones moved to /settings/imports
// (module 11) and Duplicados folded into Pendientes as an anchored section (#duplicados) — see
// apps/web/src/app/(app)/transactions/pending/page.tsx.
const TABS = [
  { label: "Movimientos", href: "/transactions" },
  { label: "Pendientes", href: "/transactions/pending" },
  { label: "Duplicados", href: "/transactions/pending#duplicados" },
  { label: "Programados", href: "/transactions/scheduled" },
  { label: "Recurrentes", href: "/transactions/recurring" },
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
