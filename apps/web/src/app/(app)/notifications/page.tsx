import { createNotificationRepository, db } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { NotificationRow } from "@/features/notifications/components/notification-row";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/features/notifications/actions/mark-all-read";

const notifications = createNotificationRepository(db);

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireCurrentUser();
  const filter = (await searchParams).filter === "unread" ? "unread" : "all";
  const items = await notifications.listForUser(user.id, { unreadOnly: filter === "unread", limit: 50 });
  const hasUnread = items.some((item) => !item.readAt);

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Notificaciones</p>
          <h1>Centro de notificaciones</h1>
          <p className="mt-4 max-w-[490px] text-body-lg leading-relaxed text-muted-foreground">Lo que pasó con tus cuentas, deudas, presupuestos y suscripción.</p>
        </div>
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
            <Button variant="outline" type="submit">Marcar todas como leídas</Button>
          </form>
        )}
      </header>

      <nav className="mt-10 flex gap-6 border-b border-border" aria-label="Filtro de notificaciones">
        <a className={filter === "all" ? "border-b-2 border-transparent px-0 py-3 text-muted-foreground active" : "border-b-2 border-transparent px-0 py-3 text-muted-foreground"} href="/notifications">Todas</a>
        <a className={filter === "unread" ? "border-b-2 border-transparent px-0 py-3 text-muted-foreground active" : "border-b-2 border-transparent px-0 py-3 text-muted-foreground"} href="/notifications?filter=unread">No leídas</a>
      </nav>

      {items.length === 0 ? (
        <section className="mt-10 max-w-[650px] rounded-lg border border-dashed border-border bg-card p-8" role="status">
          <h2>{filter === "unread" ? "No tenés notificaciones sin leer." : "Todavía no tenés notificaciones."}</h2>
          <p>Te vamos a avisar acá sobre vencimientos, presupuestos y tu suscripción.</p>
        </section>
      ) : (
        <section className="mt-10 rounded-lg border border-border bg-card" aria-label="Notificaciones">
          {items.map((item) => <NotificationRow item={item} key={item.id} />)}
        </section>
      )}
    </>
  );
}
