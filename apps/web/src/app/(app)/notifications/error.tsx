"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function NotificationsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState
        title="No pudimos cargar tus notificaciones"
        description="El centro de notificaciones falló, pero tus finanzas siguen funcionando."
        digest={error.digest}
        onRetry={reset}
      />
    </div>
  );
}
