"use client";

import { PanelLeftIcon } from "lucide-react";

import { useSidebarState } from "./sidebar-state";

// Spec 13 §6.10 — collapse/expand the desktop sidebar. Lives in the app header (not inside the
// sidebar) so activating it doesn't keep the sidebar's `:focus-within` expansion latched.
export function SidebarToggle() {
  const { collapsed, toggle } = useSidebarState();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
      aria-pressed={collapsed}
      className="hidden size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:inline-flex"
    >
      <PanelLeftIcon className="size-4" />
    </button>
  );
}
