"use client";

import { useActionState } from "react";
import { updateNotificationChannelPreferenceAction } from "../actions/update-preference";

const CHANNEL_LABEL: Record<"REALTIME" | "EMAIL" | "WHATSAPP", string> = {
  REALTIME: "Avisos en tiempo real",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

export function ChannelToggleForm({ channel, enabled, entitled }: { channel: "REALTIME" | "EMAIL" | "WHATSAPP"; enabled: boolean; entitled: boolean }) {
  const [state, formAction, pending] = useActionState(updateNotificationChannelPreferenceAction, null);

  return (
    <form className="notification-channel-row" action={formAction}>
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="enabled" value={String(!enabled)} />
      <div>
        <p className="card-label">{CHANNEL_LABEL[channel]}</p>
        {!entitled && <p className="card-helper">No disponible en tu plan actual.</p>}
        {state?.ok === false && <p className="card-helper">{state.error.message}</p>}
      </div>
      <button className="secondary-button" type="submit" disabled={pending || !entitled}>
        {enabled ? "Desactivar" : "Activar"}
      </button>
    </form>
  );
}
