import {
  createNotificationRepository,
  createUserRepository,
  insightRepository,
  transactionRepository,
  db,
} from "@know-finanzas/db";

import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUser } from "@/lib/auth/require-current-user";

const notifications = createNotificationRepository(db);
const users = createUserRepository(db);

// NOTE (greenfield rebuild): the full onboarding / product-access routing gate
// (resolveAccessRoute) is rebuilt with the onboarding screens in a later phase.
// For now this layout only enforces authentication.
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Redirects to /login itself when there's no session (or the cookie is stale).
  const user = await requireCurrentUser();

  const [profile, unreadCount, pendingCount, insightsUnseen] = await Promise.all([
    users.findById(user.id).catch(() => undefined),
    notifications.countUnreadForUser(user.id).catch(() => 0),
    // Sidebar badges (spec 13 §6.13) — cheap COUNT(*) queries, resolved once per navigation.
    transactionRepository.countUncategorizedForUser(user.id).catch(() => 0),
    insightRepository.countActiveForUser(user.id).catch(() => 0),
  ]);

  return (
    <AppShell
      user={{ name: user.name, email: user.email, image: profile?.image ?? null }}
      unreadCount={unreadCount}
      navBadges={{ "transactions-pending": pendingCount, "insights-unseen": insightsUnseen }}
    >
      {children}
    </AppShell>
  );
}
