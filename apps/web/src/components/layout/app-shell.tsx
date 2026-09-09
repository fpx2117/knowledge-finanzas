import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { AppShellMain } from "./app-shell-main";
import { SidebarStateProvider } from "./sidebar-state";
import type { NavBadgeCounts } from "./nav-items";
import { QuickAddRoot } from "@/features/capture/components/quick-add-root";
import { CommandPaletteRoot } from "@/features/shell/components/command-palette-root";
import { SessionSync } from "@/features/shell/components/session-sync";
import { NotificationsProvider } from "@/features/notifications/components/notifications-provider";

type ShellUser = { name: string; email: string; image?: string | null };

export function AppShell({
  user,
  unreadCount = 0,
  navBadges,
  children,
}: {
  user: ShellUser;
  unreadCount?: number;
  navBadges?: NavBadgeCounts;
  children: React.ReactNode;
}) {
  return (
    <SidebarStateProvider>
      <NotificationsProvider initialUnreadCount={unreadCount}>
      <div className="min-h-svh bg-background">
        {/* WCAG 2.4.1 — first focusable element on every authed page: lets keyboard and screen-reader
            users jump past the sidebar/mobile nav straight to the page content. */}
        <a
          href="#main-content"
          className="sr-only rounded-md bg-card px-4 py-2 text-small font-medium text-foreground shadow-md ring-1 ring-border focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-critical)] focus:outline-none focus:ring-[3px] focus:ring-ring/40"
        >
          Saltar al contenido
        </a>
        <Sidebar user={user} badges={navBadges} />
        <MobileNav user={user} navBadges={navBadges} />
        <AppShellMain>{children}</AppShellMain>
        <QuickAddRoot />
        <CommandPaletteRoot />
        <SessionSync />
      </div>
      </NotificationsProvider>
    </SidebarStateProvider>
  );
}
