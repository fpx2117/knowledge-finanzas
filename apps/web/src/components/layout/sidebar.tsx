import Image from "next/image";
import Link from "next/link";
import { RefreshCwIcon } from "lucide-react";

import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { QuickAddTrigger } from "@/features/capture/components/quick-add-trigger";

type SidebarUser = { name: string; email: string; image?: string | null };

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-card lg:flex">
      <Link href="/dashboard" aria-label="Know Finanzas · Ir al resumen" className="flex items-center gap-2 px-5 py-5">
        <Image src="/brand/logo.png" alt="" width={28} height={28} className="size-7 object-contain" priority />
        <span className="text-body-lg font-medium tracking-tight text-foreground">
          Know<span className="text-brand">Finanzas</span>
        </span>
      </Link>

      <div className="px-3 pb-2">
        <QuickAddTrigger />
      </div>

      <SidebarNav />

      <div className="mt-auto flex flex-col gap-1 border-t border-border p-3">
        <button
          type="button"
          className="flex h-10 items-center gap-3 rounded-md px-3 text-body text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RefreshCwIcon aria-hidden="true" className="size-[1.1rem] shrink-0" />
          Sincronizar cuentas
        </button>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </div>
    </aside>
  );
}
