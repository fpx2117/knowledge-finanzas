import { redirect } from "next/navigation";

import { createNotificationRepository, createUserRepository, db } from "@know-finanzas/db";

import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUser } from "@/lib/auth/require-current-user";

const notifications = createNotificationRepository(db);
const users = createUserRepository(db);

// NOTE (greenfield rebuild): the full onboarding / product-access routing gate
// (resolveAccessRoute) is rebuilt with the onboarding screens in a later phase.
// For now this layout only enforces authentication.
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  const [profile, unreadCount] = await Promise.all([
    users.findById(user.id).catch(() => undefined),
    notifications.countUnreadForUser(user.id).catch(() => 0),
  ]);

  return (
    <AppShell
      user={{ name: user.name, email: user.email, image: profile?.image ?? null }}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
