import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { QuickAddRoot } from "@/features/capture/components/quick-add-root";

type ShellUser = { name: string; email: string; image?: string | null };

export function AppShell({
  user,
  unreadCount = 0,
  children,
}: {
  user: ShellUser;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <Sidebar user={user} />
      <MobileNav user={user} unreadCount={unreadCount} />
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>
      <QuickAddRoot />
    </div>
  );
}
