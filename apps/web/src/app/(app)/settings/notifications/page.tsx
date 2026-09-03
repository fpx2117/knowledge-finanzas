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
      <div className="mb-7 flex gap-2 text-sm text-muted-foreground"><span>Configuración</span><span aria-hidden="true">/</span><span>Notificaciones</span></div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Avisos</p>
          <h1>Notificaciones</h1>
          <p className="mt-4 max-w-[490px] text-body-lg leading-relaxed text-muted-foreground">Elegí por qué canales querés enterarte de lo importante. Los avisos siempre quedan guardados en tu centro de notificaciones, uses o no estos canales.</p>
        </div>
      </header>

      <section className="mt-12" aria-labelledby="channels-title">
        <div className="mb-5 flex items-end justify-between border-b border-border pb-3"><div><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Canales</p><h2 id="channels-title">Cómo querés enterarte</h2></div></div>
        <div className="flex items-center justify-between border-t border-border py-4 first:border-t-0">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">En la app</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Siempre activo: aparece en tu centro de notificaciones.</p>
          </div>
        </div>
        <ChannelToggleForm channel="REALTIME" enabled={realtime.globalEnabled} entitled={realtime.entitled} />
        <ChannelToggleForm channel="EMAIL" enabled={email.globalEnabled} entitled={email.entitled} />
      </section>

      <section className="mt-12" aria-labelledby="whatsapp-title">
        <div className="mb-5 flex items-end justify-between border-b border-border pb-3"><div><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp</p><h2 id="whatsapp-title">Avisos por WhatsApp</h2></div></div>
        {!whatsapp.entitled ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Disponible con Pro.</p>
        ) : (
          <WhatsappConsentForm optedIn={view.whatsappOptedIn} />
        )}
      </section>
    </>
  );
}
