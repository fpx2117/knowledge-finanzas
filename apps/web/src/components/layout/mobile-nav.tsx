import Image from "next/image";
import Link from "next/link";

import { NotificationButton } from "./notification-button";

/**
 * Mobile top bar — deliberately minimal (reference mock): brand mark on the left, notifications
 * on the right. Primary navigation lives in the bottom tab bar (`MobileBottomNav`). Hidden on lg+.
 */
export function MobileNav() {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
      <Link href="/app" aria-label="Know Finanzas" className="flex items-center gap-2">
        <Image src="/brand/logo.png" alt="" width={24} height={24} className="size-6 object-contain" />
        <span className="text-body font-black tracking-tight text-foreground">
          Know<span className="text-brand">Finanzas</span>
        </span>
      </Link>
      <NotificationButton />
    </header>
  );
}
