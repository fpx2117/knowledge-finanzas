import { createNotificationRepository, db } from "@know-finanzas/db";

import { DateSelector } from "@/components/shared/date-selector";
import { NotificationButton } from "@/components/layout/notification-button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";

const notifications = createNotificationRepository(db);

/**
 * Standard right-side header cluster — period selector + notifications.
 * The bell is hidden below `sm` because the mobile top bar already shows one.
 * Pass `showPeriod={false}` on screens that don't scope to a month.
 */
export async function HeaderActions({ showPeriod = true }: { showPeriod?: boolean }) {
  const user = await requireCurrentUser().catch(() => null);
  const unread = user ? await notifications.countUnreadForUser(user.id).catch(() => 0) : 0;

  return (
    <>
      {showPeriod ? <DateSelector /> : null}
      <NotificationButton unreadCount={unread} className="hidden sm:inline-flex" />
    </>
  );
}
