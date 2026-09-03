"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function BillingError({ reset }: { reset: () => void }) {
  return <ErrorState message="No pudimos cargar tu suscripción y uso. Intentá nuevamente." onRetry={reset} />;
}
