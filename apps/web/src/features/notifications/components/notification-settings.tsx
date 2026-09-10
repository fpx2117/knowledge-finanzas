"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LockIcon } from "lucide-react";
import { toast } from "sonner";

import type { NotificationChannel } from "@know-finanzas/notifications";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  setChannelPreferenceAction,
  whatsappOptInAction,
  whatsappOptOutAction,
  type NotificationSettingsView,
} from "../actions/notification-actions";

const CHANNEL_META: Record<NotificationChannel, { label: string; description: string }> = {
  IN_APP: { label: "En la app", description: "La campanita y el centro de notificaciones." },
  REALTIME: { label: "En vivo", description: "Avisos instantáneos mientras usás la app." },
  EMAIL: { label: "Correo", description: "Resúmenes semanales/mensuales y alertas de presupuesto y vencimientos." },
  WHATSAPP: { label: "WhatsApp", description: "Alertas de alta prioridad directo a tu teléfono." },
};

export function NotificationSettings({ initial }: { initial: NotificationSettingsView }) {
  const [view, setView] = useState(initial);
  const [pendingChannel, setPendingChannel] = useState<NotificationChannel | null>(null);
  const [, startTransition] = useTransition();

  function toggleChannel(channel: NotificationChannel, enabled: boolean) {
    setPendingChannel(channel);
    setView((prev) => ({
      ...prev,
      channels: prev.channels.map((c) => (c.channel === channel ? { ...c, globalEnabled: enabled } : c)),
    }));
    startTransition(async () => {
      const result = await setChannelPreferenceAction({ channel, enabled });
      if (!result.ok) {
        toast.error(result.error.message);
        setView((prev) => ({
          ...prev,
          channels: prev.channels.map((c) => (c.channel === channel ? { ...c, globalEnabled: !enabled } : c)),
        }));
      }
      setPendingChannel(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-border">
        {view.channels.map((channel) => {
          const meta = CHANNEL_META[channel.channel];
          const locked = !channel.entitled;
          return (
            <li key={channel.channel} className="flex items-start justify-between gap-4 py-4 first:pt-0">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-small font-medium text-foreground">
                  {meta.label}
                  {locked ? <LockIcon className="size-3.5 text-muted-foreground" aria-label="Requiere Pro" /> : null}
                </span>
                <span className="text-caption text-muted-foreground">{meta.description}</span>
                {locked ? (
                  <Link href="/pricing" className="mt-1 text-caption font-medium text-brand hover:underline">
                    Disponible con Pro — ver planes
                  </Link>
                ) : null}
              </div>
              <Switch
                checked={!locked && channel.globalEnabled}
                disabled={locked || pendingChannel === channel.channel}
                onCheckedChange={(next) => toggleChannel(channel.channel, next)}
                aria-label={`${meta.label}: ${channel.globalEnabled ? "activado" : "desactivado"}`}
              />
            </li>
          );
        })}
      </ul>

      {view.channels.find((c) => c.channel === "WHATSAPP")?.entitled ? (
        <WhatsappConsent
          phone={view.whatsappPhone}
          optedIn={view.whatsappOptedIn}
          onChange={(next) => setView((prev) => ({ ...prev, whatsappOptedIn: next.optedIn, whatsappPhone: next.phone }))}
        />
      ) : null}
    </div>
  );
}

function WhatsappConsent({
  phone,
  optedIn,
  onChange,
}: {
  phone: string | null;
  optedIn: boolean;
  onChange: (next: { optedIn: boolean; phone: string | null }) => void;
}) {
  const [value, setValue] = useState(phone ?? "");
  const [pending, start] = useTransition();

  if (optedIn) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
        <span className="text-small text-foreground">
          WhatsApp confirmado{phone ? ` en ${phone}` : ""}.
        </span>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await whatsappOptOutAction();
              if (result.ok) {
                toast.success("Listo, no te vamos a escribir por WhatsApp.");
                onChange({ optedIn: false, phone: null });
              } else {
                toast.error(result.error.message);
              }
            })
          }
        >
          Desactivar
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-xl border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await whatsappOptInAction({ phoneNumber: value });
          if (result.ok) {
            toast.success("¡Listo! Te vamos a avisar por WhatsApp.");
            onChange({ optedIn: true, phone: value.trim() });
          } else {
            toast.error(result.error.message);
          }
        });
      }}
    >
      <label htmlFor="wa-phone" className="text-small font-medium text-foreground">
        Confirmá tu WhatsApp
      </label>
      <p className="text-caption text-muted-foreground">Formato internacional, con el +. Ej.: +5491122334455.</p>
      <div className="flex flex-wrap gap-2">
        <Input
          id="wa-phone"
          type="tel"
          inputMode="tel"
          placeholder="+54 9 11 2233 4455"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="max-w-56"
          required
        />
        <Button type="submit" disabled={pending || value.trim().length < 8}>
          {pending ? "Confirmando…" : "Confirmar"}
        </Button>
      </div>
    </form>
  );
}
