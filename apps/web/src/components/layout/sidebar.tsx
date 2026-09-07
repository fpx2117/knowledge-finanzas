"use client";

import Image from "next/image";
import Link from "next/link";

import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { useSidebarState } from "./sidebar-state";
import type { NavBadgeCounts } from "./nav-items";
import { cn } from "@/lib/utils";
import { QuickAddTrigger } from "@/features/capture/components/quick-add-trigger";

type SidebarUser = { name: string; email: string; image?: string | null };

export function Sidebar({ user, badges }: { user: SidebarUser; badges?: NavBadgeCounts }) {
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
      <Link href="/app" aria-label="Know Finanzas · Ir al resumen" className="flex shrink-0 items-center gap-2 px-4 py-5">
        <Image src="/brand/logo.png" alt="" width={28} height={28} className="size-7 shrink-0 object-contain" priority />
        <span className="whitespace-nowrap text-body-lg font-medium tracking-tight text-foreground">
          Know<span className="text-brand">Finanzas</span>
        </span>
      </Link>

      {/* §7.1 / §6.10 — the "+ Registrar" action keeps its icon (and its label once expanded). */}
      <div className="px-3 pb-2">
        <QuickAddTrigger />
      </div>

      <SidebarNav badges={badges} />

      {/* §6.12 / §6.16 — the account zone stays pinned at the bottom, its own region. */}
      <div className="mt-auto border-t border-border p-3">
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </div>
    </aside>
  );
}
