"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function CalendarError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos cargar tu calendario" digest={error.digest} onRetry={reset} />
    </div>
  );
}
