"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function DebtsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos cargar tus obligaciones" onRetry={reset} />
    </div>
  );
}
