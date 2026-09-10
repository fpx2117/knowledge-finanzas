"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { startSubscriptionAction, startTrialAction, cancelSubscriptionAction } from "../actions/billing-actions";

export function UpgradeToProButton({ label = "Mejorar a Pro", variant = "default" as const, className }: { label?: string; variant?: "default" | "outline"; className?: string }) {
  const [pending, start] = useTransition();

  return (
    <Button
      variant={variant}
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await startSubscriptionAction();
          if (result.ok) {
            window.location.href = result.data.checkoutUrl;
            return;
          }
          toast.error(result.error.message);
        })
      }
    >
      {pending ? "Abriendo el pago…" : label}
    </Button>
  );
}

export function StartTrialButton({ label = "Probar Pro 14 días gratis", variant = "outline" as const, className }: { label?: string; variant?: "default" | "outline"; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant={variant}
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await startTrialAction();
          if (result.ok) {
            toast.success("¡Listo! Tenés 14 días de Pro.");
            router.refresh();
            return;
          }
          toast.error(result.error.message);
        })
      }
    >
      {pending ? "Activando…" : label}
    </Button>
  );
}

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
        Cancelar suscripción
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-caption text-muted-foreground">¿Seguro? Perdés el acceso Pro de inmediato.</span>
      <Button
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await cancelSubscriptionAction({ subscriptionId });
            if (result.ok) {
              toast.success("Suscripción cancelada. Seguís con el plan gratis.");
              router.refresh();
              return;
            }
            toast.error(result.error.message);
            setConfirming(false);
          })
        }
      >
        {pending ? "Cancelando…" : "Sí, cancelar"}
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
        No
      </Button>
    </div>
  );
}
