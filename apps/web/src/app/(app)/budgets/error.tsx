"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function BudgetsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos cargar tus presupuestos" onRetry={reset} />
    </div>
  );
}
