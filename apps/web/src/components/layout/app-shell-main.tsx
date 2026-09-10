"use client";

import { AppHeader } from "./app-header";
import { useSidebarState } from "./sidebar-state";
import { GlobalBanners } from "@/features/shell/components/global-banners";
import { cn } from "@/lib/utils";

// The content column. Its left inset follows the sidebar's collapsed state (§6.10 — collapsed,
// the sidebar is a narrow rail and only overlays the content when hovered, so the content sits
// against the rail width, not the full width).
export function AppShellMain({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarState();

  return (
    <div className={cn("transition-[padding] duration-150", collapsed ? "lg:pl-16" : "lg:pl-60")}>
      <AppHeader />
      <GlobalBanners />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-5 outline-none sm:px-6 lg:px-10 lg:py-9"
      >
        {children}
      </main>
    </div>
  );
}
