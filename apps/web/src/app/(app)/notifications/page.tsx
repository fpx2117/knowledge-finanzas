import { PageHeader } from "@/components/shared/page-header";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { notificationService } from "@/features/notifications/services/notification-service.instance";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

// spec 13 §17 — el centro de notificaciones. Ordenado por prioridad (§17.4), leído ≠ resuelto
// (§17.6), cada notificación accionable lleva a su contexto (§17.7). Si esto falla, la app
// financiera sigue funcionando (§17.12) — es una ruta aparte, nada del núcleo depende de ella.
export default async function NotificationsPage() {
  const user = await requireCurrentUser();
  const { items } = await notificationService.getInbox(user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        title="Notificaciones"
        description="Avisos de vencimientos, presupuestos, seguridad y tu plan. Marcar como leído no resuelve la obligación."
      />
      <NotificationCenter initialItems={items} />
    </div>
  );
}
