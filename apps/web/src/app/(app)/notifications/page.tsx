import { createNotificationRepository, db } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { NotificationRow } from "@/features/notifications/components/notification-row";
import { markAllNotificationsReadAction } from "@/features/notifications/actions/mark-all-read";

const notifications = createNotificationRepository(db);

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireCurrentUser();
  const filter = (await searchParams).filter === "unread" ? "unread" : "all";
  const items = await notifications.listForUser(user.id, { unreadOnly: filter === "unread", limit: 50 });
  const hasUnread = items.some((item) => !item.readAt);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Notificaciones</p>
          <h1>Centro de notificaciones</h1>
          <p className="lede">Lo que pasó con tus cuentas, deudas, presupuestos y suscripción.</p>
        </div>
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
            <button className="secondary-button" type="submit">Marcar todas como leídas</button>
          </form>
        )}
      </header>

      <nav className="planning-tabs" aria-label="Filtro de notificaciones">
        <a className={filter === "all" ? "planning-tab active" : "planning-tab"} href="/notifications">Todas</a>
        <a className={filter === "unread" ? "planning-tab active" : "planning-tab"} href="/notifications?filter=unread">No leídas</a>
      </nav>

      {items.length === 0 ? (
        <section className="accounts-empty" role="status">
          <h2>{filter === "unread" ? "No tenés notificaciones sin leer." : "Todavía no tenés notificaciones."}</h2>
          <p>Te vamos a avisar acá sobre vencimientos, presupuestos y tu suscripción.</p>
        </section>
      ) : (
        <section className="transaction-list" aria-label="Notificaciones">
          {items.map((item) => <NotificationRow item={item} key={item.id} />)}
        </section>
      )}
    </>
  );
}
