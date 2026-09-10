"use client";

import Image from "next/image";
import Link from "next/link";

import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { useSidebarState } from "./sidebar-state";
import type { NavBadgeCounts, SidebarAccountLink } from "./nav-items";
import { cn } from "@/lib/utils";
import { QuickAddTrigger } from "@/features/capture/components/quick-add-trigger";

type SidebarUser = { name: string; email: string; image?: string | null };

export function Sidebar({ user, badges, accountLinks = [] }: { user: SidebarUser; badges?: NavBadgeCounts; accountLinks?: SidebarAccountLink[] }) {
  const { collapsed } = useSidebarState();

  return (
    <aside
      aria-label="Barra lateral"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "group/sidebar fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden flex-col overflow-hidden border-r border-border bg-card transition-[width,box-shadow] duration-150 lg:flex",
        // §6.10 — collapsed to a rail, but hover / keyboard focus expands it back over the content.
        collapsed
          ? "w-16 hover:w-60 hover:z-[var(--z-popover)] hover:shadow-2xl focus-within:w-60 focus-within:z-[var(--z-popover)] focus-within:shadow-2xl"
          : "w-60",
      )}
    >
      <Link
        href="/app"
        aria-label="Know Finanzas · Ir al resumen"
        className="flex shrink-0 items-center gap-2.5 px-5 pb-4 pt-6"
      >
        <Image src="/brand/logo.png" alt="" width={30} height={30} className="size-[30px] shrink-0 object-contain" priority />
        <span className="whitespace-nowrap text-[19px] font-black tracking-[-0.04em] text-foreground group-data-[collapsed=true]/sidebar:hidden">
          Know<span className="text-brand">Finanzas</span>
        </span>
      </Link>

      {/* §7.1 / §6.10 — the "+ Registrar" action keeps its icon (and its label once expanded). */}
      <div className="px-3 pb-1">
        <QuickAddTrigger />
      </div>

      <SidebarNav badges={badges} accountLinks={accountLinks} />

      {/* §6.12 / §6.16 — the account zone stays pinned at the bottom, its own region. */}
      <div className="mt-auto shrink-0 border-t border-border p-3">
        <UserMenu name={user.name} email={user.email} image={user.image} />
        <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 group-data-[collapsed=true]/sidebar:hidden">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
              <path d="M3 3v18h18" />
              <path d="m7 15 4-4 3 3 5-6" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-caption font-semibold text-foreground">Plan Personal</span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Knowledge</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
