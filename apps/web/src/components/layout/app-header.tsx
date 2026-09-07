import { NotificationButton } from "./notification-button";
import { SidebarToggle } from "./sidebar-toggle";
import { CommandPaletteTrigger } from "@/features/shell/components/command-palette-trigger";

// Spec 13 §9 — the desktop app header holds only *global* actions (sidebar toggle, search,
// notifications), never page-level filters, KPIs or tabs (§9.3). The page title/description/CTA
// live in each screen's own PageHeader (§9.4). Sticky (§9.5).
export function AppHeader({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <header aria-label="Acciones globales" className="sticky top-0 z-10 hidden h-14 items-center justify-between gap-4 border-b border-border bg-background/85 px-6 backdrop-blur lg:flex lg:px-10">
      <div className="flex items-center gap-2">
        <SidebarToggle />
        <CommandPaletteTrigger />
      </div>
      <NotificationButton unreadCount={unreadCount} />
    </header>
  );
}
