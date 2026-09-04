"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationButton } from "./notification-button";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { QuickAddTrigger } from "@/features/capture/components/quick-add-trigger";

type MobileUser = { name: string; email: string; image?: string | null };

export function MobileNav({ user, unreadCount }: { user: MobileUser; unreadCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Abrir navegación"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground"
        >
          <MenuIcon className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-body-lg font-medium tracking-tight">
              <Image src="/brand/logo.png" alt="" width={24} height={24} className="size-6 object-contain" />
              Know<span className="text-brand">Finanzas</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col py-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t border-border p-3">
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/app" aria-label="Know Finanzas" className="flex items-center gap-2">
        <Image src="/brand/logo.png" alt="" width={24} height={24} className="size-6 object-contain" />
        <span className="text-body font-medium tracking-tight text-foreground">
          Know<span className="text-brand">Finanzas</span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <QuickAddTrigger variant="mobile" />
        <NotificationButton unreadCount={unreadCount} />
      </div>
    </header>
  );
}
