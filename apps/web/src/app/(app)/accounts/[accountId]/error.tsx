"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function AccountDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos cargar esta cuenta" onRetry={reset} />
    </div>
  );
}
