"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function GoalsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos cargar tus metas" onRetry={reset} />
    </div>
  );
}
