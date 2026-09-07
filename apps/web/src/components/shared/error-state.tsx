"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error surface — spec 13 §27.3: never "Error 500", always plain language, and state
 * that the data wasn't modified when that's verifiably true. §27.4 — a support code (the Next
 * error `digest`) can be shown and copied; never a stack trace.
 */
export function ErrorState({
  title = "No pudimos cargar esta sección",
  description = "Ocurrió un error al obtener tus datos. Tu información no fue modificada.",
  digest,
  onRetry,
}: {
  title?: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);

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
      {digest ? (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(digest).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              },
              () => {},
            );
          }}
          className="mt-2 inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          Código de soporte: <span className="font-mono">{digest}</span>
        </button>
      ) : null}
    </div>
  );
}
