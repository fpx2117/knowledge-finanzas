import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { getNotificationSettingsAction } from "@/features/notifications/actions/notification-actions";
import { NotificationSettings } from "@/features/notifications/components/notification-settings";

export default async function NotificationSettingsPage() {
  const settings = await getNotificationSettingsAction();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Notificaciones" description="Qué te avisamos y por qué canal." />
      <SectionCard title="Canales" subtitle="El correo y WhatsApp son parte de Pro. En la app y en vivo están siempre disponibles.">
        <NotificationSettings initial={settings} />
      </SectionCard>
    </div>
  );
}
