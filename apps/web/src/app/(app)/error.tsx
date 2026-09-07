"use client";

import { ErrorState } from "@/components/shared/error-state";

// Spec 13 §27.2 — the shell-level fallback. A page that throws without its own module `error.tsx`
// lands here, *inside* the (app) layout, so the sidebar and header stay put — the user isn't
// dropped onto a bare full-page error. Module boundaries (accounts/error.tsx, insights/error.tsx…)
// still catch first where they exist (§27.1).
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-6">
      <ErrorState
        title="No pudimos cargar esta sección"
        description="Ocurrió un error inesperado. Tu información financiera no fue modificada."
        digest={error.digest}
        onRetry={reset}
      />
    </div>
  );
}
