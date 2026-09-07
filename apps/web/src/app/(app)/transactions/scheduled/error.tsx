"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ScheduledError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos cargar los movimientos programados" digest={error.digest} onRetry={reset} />
    </div>
  );
}
