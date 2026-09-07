"use client";

import { AppHeader } from "./app-header";
import { useSidebarState } from "./sidebar-state";
import { cn } from "@/lib/utils";

// The content column. Its left inset follows the sidebar's collapsed state (§6.10 — collapsed,
// the sidebar is a narrow rail and only overlays the content when hovered, so the content sits
// against the rail width, not the full width).
export function AppShellMain({ unreadCount, children }: { unreadCount?: number; children: React.ReactNode }) {
  const { collapsed } = useSidebarState();

  return (
    <div className={cn("transition-[padding] duration-150", collapsed ? "lg:pl-16" : "lg:pl-60")}>
      <AppHeader unreadCount={unreadCount} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1280px] px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-9"
      >
        {children}
      </main>
    </div>
  );
}
