"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  isNavChildActive,
  isNavItemActive,
  type NavBadgeCounts,
  type NavItem,
} from "./nav-items";

// Spec 13 §6.14 — a badge shows 1–99, then "99+". Never rendered at 0 (§6.13: only when actionable).
function badgeText(count: number): string | null {
  if (!count || count < 1) return null;
  return count > 99 ? "99+" : String(count);
}

function Badge({ text, label }: { text: string; label: string }) {
  return (
    <span
      aria-label={label}
      className="ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-brand/12 px-1.5 text-caption font-medium tabular-nums text-brand"
    >
      {text}
    </span>
  );
}

function itemBadge(item: NavItem, badges: NavBadgeCounts) {
  if (!item.badge) return null;
  const text = badgeText(badges[item.badge] ?? 0);
  if (!text) return null;
  const label =
    item.badge === "transactions-pending"
      ? `${text} movimientos por revisar`
      : `${text} insights nuevos`;
  return <Badge text={text} label={label} />;
}

function NavGroup({
  item,
  pathname,
  badges,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  badges: NavBadgeCounts;
  onNavigate?: () => void;
}) {
  const sectionActive = isNavItemActive(pathname, item.href);
  // §6.7 — a deep link into a subview forces its ancestor open; §6.8/§6.9 — the user can then
  // toggle it, and several sections may stay open at once (no forced accordion).
  const [open, setOpen] = useState(sectionActive);
  const Icon = item.icon;
  const expanded = open || sectionActive;
  const badge = itemBadge(item, badges);

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
          title={item.label}
          aria-current={pathname === item.href ? "page" : undefined}
          className="flex h-full flex-1 items-center gap-3 rounded-md px-3"
        >
          <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
          <span className="flex-1 whitespace-nowrap">{item.label}</span>
          {badge}
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

      {/* §6.8/§6.9 — el submenú se contrae/expande con animación. Truco grid-rows 0fr↔1fr: no hace
          falta medir la altura. `inert` lo saca del foco / a11y cuando está cerrado. */}
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity,visibility] duration-200 ease-out motion-reduce:transition-none",
          expanded ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0",
        )}
      >
        <ul
          inert={!expanded || undefined}
          className="mb-1 ml-[1.55rem] mt-0.5 flex min-h-0 flex-col gap-0.5 border-l border-border pl-3"
        >
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
      </div>
    </li>
  );
}

function FlatItem({
  item,
  pathname,
  badges,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  badges: NavBadgeCounts;
  onNavigate?: () => void;
}) {
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        title={item.label}
        className={cn(
          "relative flex h-10 items-center gap-3 rounded-md px-3 text-body transition-colors",
          "text-muted-foreground hover:bg-brand-subtle hover:text-brand",
          active && "bg-brand-subtle font-medium text-brand",
          active &&
            "after:absolute after:right-0 after:top-1/2 after:h-5 after:w-0.5 after:-translate-y-1/2 after:rounded-full after:bg-primary",
        )}
      >
        <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
        <span className="flex-1 whitespace-nowrap">{item.label}</span>
        {itemBadge(item, badges)}
      </Link>
    </li>
  );
}

export function SidebarNav({
  badges = {},
  onNavigate,
}: {
  badges?: NavBadgeCounts;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col overflow-y-auto px-3">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) =>
          item.children?.length ? (
            <NavGroup key={item.href} item={item} pathname={pathname} badges={badges} onNavigate={onNavigate} />
          ) : (
            <FlatItem key={item.href} item={item} pathname={pathname} badges={badges} onNavigate={onNavigate} />
          ),
        )}
      </ul>

      {/* §6.16 — separator between financial navigation and configuración/ayuda. */}
      <hr className="my-2 border-border" />

      <ul className="flex flex-col gap-0.5">
        {SECONDARY_NAV_ITEMS.map((item) => (
          <FlatItem key={item.href} item={item} pathname={pathname} badges={badges} onNavigate={onNavigate} />
        ))}
      </ul>
    </nav>
  );
}
