"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function AccountsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-6">
      <ErrorState title="No pudimos cargar tus cuentas" digest={error.digest} onRetry={reset} />
    </div>
  );
}
