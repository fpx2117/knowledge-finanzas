"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function CalendarError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos cargar tu calendario" onRetry={reset} />
    </div>
  );
}
