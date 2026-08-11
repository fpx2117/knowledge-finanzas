import { redirect } from "next/navigation";

import { createNotificationRepository, db } from "@know-finanzas/db";
import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { resolveAccessRoute } from "@/lib/onboarding/access-route.instance";

const notifications = createNotificationRepository(db);

// Some routes under this layout (e.g. /debts/new's preview calculator) are intentionally
// reachable without a session — auth is enforced per-page, not here. The badge count is a
// nice-to-have, so an unauthenticated visitor just sees no badge instead of an error page.
async function getInitialUnreadCount(userId: string | null): Promise<number> {
  if (!userId) return 0;
  try {
    return await notifications.countUnreadForUser(userId);
  } catch {
    return 0;
  }
}

// TASK-064's routing guard, enforced: every page under (app) — dashboard, accounts, transactions,
// budgets, debts, billing, settings, planning, notifications — requires onboarding COMPLETED and
// an active access selection (or EXPIRED_READ_ONLY, which is allowed through in read-only mode;
// ProductAccessGate is what actually blocks writes for that state). /onboarding, /elegir-acceso,
// and the financial-onboarding flow all live outside this route group so they're never caught by
// their own redirect.
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let userId: string | null = null;
  try {
    userId = (await requireCurrentUser()).id;
  } catch {
    // Unauthenticated — let the page itself handle it (matches the prior per-page auth pattern).
  }

  if (userId) {
    const gate = await resolveAccessRoute(userId);
    if (gate.destination === "ONBOARDING") redirect("/onboarding");
    if (gate.destination === "ACCESS_SELECTION") redirect("/elegir-acceso");
    if (gate.destination === "FINANCIAL_ONBOARDING") redirect("/onboarding/financial-onboarding");
  }

  const initialUnreadCount = await getInitialUnreadCount(userId);

  return <AppShell active="Cuentas" initialUnreadCount={initialUnreadCount}>{children}</AppShell>;
}
