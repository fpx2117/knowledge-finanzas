"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, LayoutGridIcon, PlusIcon, WalletIcon, BarChart3Icon, type LucideIcon } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import type { NavBadgeCounts, SidebarAccountLink } from "./nav-items";
import { openQuickAdd } from "@/features/capture/components/quick-add-root";
import { cn } from "@/lib/utils";

type MobileUser = { name: string; email: string; image?: string | null };

const TABS: { label: string; href: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { label: "Resumen", href: "/app", icon: HomeIcon, match: (p) => p === "/app" },
  { label: "Cuentas", href: "/accounts", icon: WalletIcon, match: (p) => p.startsWith("/accounts") },
  { label: "Reportes", href: "/reports", icon: BarChart3Icon, match: (p) => p.startsWith("/reports") },
];

// One shared type treatment for every tab so the bar reads as a single set. `globals.css` has a
// bare `button, a { font: inherit }` that outranks Tailwind utilities, so the label size lives on
// an inner <span> (LABEL), never on the <a>/<button> itself.
const CELL = "flex flex-1 flex-col items-center justify-center gap-1 pt-1.5";
const LABEL = "text-[11px] font-semibold leading-none tracking-tight";

/**
 * Mobile bottom tab bar (reference mock): Resumen · Cuentas · Registrar (FAB) · Reportes · Más.
 * "Más" opens the full navigation sheet. Hidden on lg+ where the sidebar takes over.
 */
export function MobileBottomNav({ user, navBadges, accountLinks = [] }: { user: MobileUser; navBadges?: NavBadgeCounts; accountLinks?: SidebarAccountLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      aria-label="Navegación"
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex items-stretch border-t border-border bg-card/95 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
    >
      {TABS.slice(0, 2).map((tab) => (
        <NavTab key={tab.href} tab={tab} active={tab.match(pathname)} />
      ))}

      <div className="flex flex-1 flex-col items-center gap-1 pt-1.5">
        <button
          type="button"
          onClick={() => openQuickAdd()}
          aria-label="Registrar movimiento"
          className="-mt-6 grid size-12 place-items-center rounded-full bg-brand text-white shadow-[0_6px_16px_-4px_rgb(16_43_166_/_0.5)] transition-transform active:scale-95"
        >
          <PlusIcon className="size-6" strokeWidth={2.25} />
        </button>
        <span className={cn(LABEL, "text-muted-foreground")}>Registrar</span>
      </div>

      {TABS.slice(2).map((tab) => (
        <NavTab key={tab.href} tab={tab} active={tab.match(pathname)} />
      ))}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className={cn(CELL, "text-muted-foreground")}>
          <LayoutGridIcon className="size-[22px]" strokeWidth={1.75} />
          <span className={LABEL}>Más</span>
        </SheetTrigger>
        <SheetContent side="right" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-body-lg font-black tracking-tight">
              <Image src="/brand/logo.png" alt="" width={24} height={24} className="size-6 object-contain" />
              Know<span className="text-brand">Finanzas</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col py-3">
            <SidebarNav badges={navBadges} accountLinks={accountLinks} onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t border-border p-3">
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

function NavTab({ tab, active }: { tab: (typeof TABS)[number]; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn("relative", CELL, active ? "text-brand" : "text-muted-foreground")}
    >
      {active ? <span aria-hidden className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand" /> : null}
      <Icon className="size-[22px]" strokeWidth={1.75} />
      <span className={LABEL}>{tab.label}</span>
    </Link>
  );
}
