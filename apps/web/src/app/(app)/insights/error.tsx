"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function InsightsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos generar tus insights" digest={error.digest} onRetry={reset} />
    </div>
  );
}
