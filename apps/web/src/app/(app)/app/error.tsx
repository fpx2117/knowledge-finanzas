"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState
        title="No pudimos cargar tu resumen"
        description="Ocurrió un error al calcular tu posición financiera. Tus datos están a salvo." digest={error.digest} onRetry={reset} />
    </div>
  );
}
