"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function AdminAuditError({ reset }: { reset: () => void }) {
  return <ErrorState message="No pudimos cargar el historial de auditoría. Intentá nuevamente." onRetry={reset} />;
}
