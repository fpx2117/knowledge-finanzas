"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error surface — visual-design-personal.md §23: financial errors
 * must be explicit and recoverable, never a silent failure.
 */
export function ErrorState({
  title = "No pudimos cargar esta sección",
  description = "Ocurrió un error al obtener tus datos. Tu información está a salvo.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-14 text-center">
      <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-lg bg-negative-soft text-[var(--negative)]">
        <TriangleAlertIcon className="size-5" />
      </span>
      <h2 className="text-body-lg font-medium text-foreground">{title}</h2>
      <p className="max-w-sm text-small text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-1">
          <RotateCwIcon className="size-4" /> Reintentar
        </Button>
      ) : null}
    </div>
  );
}
