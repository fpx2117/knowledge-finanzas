"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavChildActive, isNavItemActive, type NavItem } from "./nav-items";

function NavGroup({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const sectionActive = isNavItemActive(pathname, item.href);
  const [open, setOpen] = useState(sectionActive);
  const Icon = item.icon;
  const expanded = open || sectionActive;

  return (
    <li>
      <div
        className={cn(
          "relative flex h-10 items-center rounded-md pr-1 text-body transition-colors",
          "text-muted-foreground hover:bg-brand-subtle hover:text-brand",
          sectionActive && "font-medium text-brand",
        )}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={pathname === item.href ? "page" : undefined}
          className="flex h-full flex-1 items-center gap-3 rounded-md px-3"
        >
          <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
          {item.label}
        </Link>
        <button
          type="button"
          aria-label={expanded ? `Contraer ${item.label}` : `Expandir ${item.label}`}
          aria-expanded={expanded}
          onClick={() => setOpen((v) => !v)}
          className="flex size-7 items-center justify-center rounded-md hover:bg-brand-subtle"
        >
          <ChevronRightIcon className={cn("size-4 transition-transform", expanded && "rotate-90")} />
        </button>
      </div>

      {expanded ? (
        <ul className="mb-1 ml-[1.55rem] mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
          {item.children!.map((child) => {
            const active = isNavChildActive(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center rounded-md px-2.5 text-small transition-colors",
                    active ? "bg-brand-subtle font-medium text-brand" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col overflow-y-auto px-3">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          if (item.children?.length) {
            return <NavGroup key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />;
          }
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
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
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
