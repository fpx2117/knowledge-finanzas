import { createNotificationPreferenceRepository, db } from "@know-finanzas/db";
import { createResolveNotificationPreferences } from "@know-finanzas/notifications";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { resolveChannelEntitlementsForUser } from "@/lib/notifications/channel-entitlements";
import { ChannelToggleForm } from "@/features/notifications/components/channel-toggle-form";
import { WhatsappConsentForm } from "@/features/notifications/components/whatsapp-consent-form";

const resolvePreferences = createResolveNotificationPreferences({ preferences: createNotificationPreferenceRepository(db) });

export default async function NotificationSettingsPage() {
  const user = await requireCurrentUser();
  const channelEntitlements = await resolveChannelEntitlementsForUser(user.id);
  const view = await resolvePreferences({ userId: user.id, channelEntitlements });

  const realtime = view.channels.find((c) => c.channel === "REALTIME")!;
  const email = view.channels.find((c) => c.channel === "EMAIL")!;
  const whatsapp = view.channels.find((c) => c.channel === "WHATSAPP")!;

  return (
    <>
      <div className="settings-kicker"><span>Configuración</span><span aria-hidden="true">/</span><span>Notificaciones</span></div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Avisos</p>
          <h1>Notificaciones</h1>
          <p className="lede">Elegí por qué canales querés enterarte de lo importante. Los avisos siempre quedan guardados en tu centro de notificaciones, uses o no estos canales.</p>
        </div>
      </header>

      <section className="dashboard-section" aria-labelledby="channels-title">
        <div className="dashboard-section-heading"><div><p className="card-label">Canales</p><h2 id="channels-title">Cómo querés enterarte</h2></div></div>
        <div className="notification-channel-row">
          <div>
            <p className="card-label">En la app</p>
            <p className="card-helper">Siempre activo: aparece en tu centro de notificaciones.</p>
          </div>
        </div>
        <ChannelToggleForm channel="REALTIME" enabled={realtime.globalEnabled} entitled={realtime.entitled} />
        <ChannelToggleForm channel="EMAIL" enabled={email.globalEnabled} entitled={email.entitled} />
      </section>

      <section className="dashboard-section" aria-labelledby="whatsapp-title">
        <div className="dashboard-section-heading"><div><p className="card-label">WhatsApp</p><h2 id="whatsapp-title">Avisos por WhatsApp</h2></div></div>
        {!whatsapp.entitled ? (
          <p className="card-helper">Disponible con Pro.</p>
        ) : (
          <WhatsappConsentForm optedIn={view.whatsappOptedIn} />
        )}
      </section>
    </>
  );
}
