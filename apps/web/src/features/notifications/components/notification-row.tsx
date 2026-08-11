import Link from "next/link";
import type { NotificationSubjectType, NotificationType } from "@know-finanzas/notifications";
import { renderNotificationBody, renderNotificationTitle } from "../lib/templates";
import { resolveRelatedRoute } from "../lib/resolve-related-route";
import { markNotificationReadAction } from "../actions/mark-read";
import { archiveNotificationAction } from "../actions/archive";

export type NotificationRowItem = {
  id: string;
  type: NotificationType;
  subjectType: NotificationSubjectType;
  subjectId: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
};

function formatRelativeTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function NotificationRow({ item }: { item: NotificationRowItem }) {
  const title = renderNotificationTitle(item.type, item.metadata as Record<string, unknown> | null);
  const body = renderNotificationBody(item.type, item.metadata as Record<string, unknown> | null);
  const relatedRoute = resolveRelatedRoute(item.subjectType, item.subjectId);
  const unread = !item.readAt;

  return (
    <article className={unread ? "transaction-row notification-row unread" : "transaction-row notification-row"}>
      <div>
        {relatedRoute ? <Link className="notification-title-link" href={relatedRoute}>{title}</Link> : <strong>{title}</strong>}
        <p>{body}</p>
        <p className="card-helper">{formatRelativeTime(item.createdAt)}</p>
      </div>
      <div className="notification-actions">
        {unread && (
          <form action={markNotificationReadAction}>
            <input type="hidden" name="notificationId" value={item.id} />
            <button className="text-button" type="submit">Marcar leída</button>
          </form>
        )}
        <form action={archiveNotificationAction}>
          <input type="hidden" name="notificationId" value={item.id} />
          <button className="text-button" type="submit">Archivar</button>
        </form>
      </div>
    </article>
  );
}
