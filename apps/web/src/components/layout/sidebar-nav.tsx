"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "relative flex h-10 items-center gap-3 rounded-md px-3 text-body transition-colors",
              "text-muted-foreground hover:bg-brand-subtle hover:text-brand",
              active && "bg-brand-subtle font-medium text-brand",
              active &&
                "after:absolute after:right-0 after:top-1/2 after:h-5 after:w-0.5 after:-translate-y-1/2 after:rounded-full after:bg-primary",
            )}
          >
            <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
