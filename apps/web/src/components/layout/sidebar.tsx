import Image from "next/image";
import Link from "next/link";

import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import type { NavBadgeCounts } from "./nav-items";
import { QuickAddTrigger } from "@/features/capture/components/quick-add-trigger";

type SidebarUser = { name: string; email: string; image?: string | null };

export function Sidebar({ user, badges }: { user: SidebarUser; badges?: NavBadgeCounts }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-card lg:flex">
      <Link href="/app" aria-label="Know Finanzas · Ir al resumen" className="flex items-center gap-2 px-5 py-5">
        <Image src="/brand/logo.png" alt="" width={28} height={28} className="size-7 object-contain" priority />
        <span className="text-body-lg font-medium tracking-tight text-foreground">
          Know<span className="text-brand">Finanzas</span>
        </span>
      </Link>

      {/* §7.1 — global "+ Registrar" above the nav, below the brand. */}
      <div className="px-3 pb-2">
        <QuickAddTrigger />
      </div>

      <SidebarNav badges={badges} />

      {/* §6.16 — the account zone is its own region, separated from navigation. */}
      <div className="mt-auto border-t border-border p-3">
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </div>
    </aside>
  );
}
