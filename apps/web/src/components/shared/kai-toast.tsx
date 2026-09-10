"use client";

import type * as React from "react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import type { KaiVisualState } from "@know-finanzas/kai";

import { KaiAvatar } from "@/features/kai/components/kai-avatar";
import { cn } from "@/lib/utils";

const NAME_COLOR: Record<KaiVisualState, string> = {
  NEUTRAL: "text-[var(--color-kai-neutral)]",
  ANALYTICAL: "text-[var(--color-kai-analytical)]",
  ALERT: "text-[var(--color-kai-alert)]",
  POSITIVE: "text-[var(--color-kai-positive)]",
};

type KaiToastOptions = {
  /** KAI's expression — POSITIVE by default (a confirmation). */
  state?: KaiVisualState;
  description?: React.ReactNode;
  action?: { label: string; onClick: () => void | Promise<void> };
  duration?: number;
};

/**
 * A confirmation/status toast spoken by KAI (avatar + name), replacing the bare `toast.success`
 * for capture flows — Diego wants KAI to be the one telling him "registré el gasto".
 */
export function kaiToast(message: React.ReactNode, options: KaiToastOptions = {}) {
  const state = options.state ?? "POSITIVE";
  return toast.custom(
    (id) => (
      <div className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-md)]">
        <KaiAvatar state={state} size={36} className="mt-0.5" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn("text-caption font-bold", NAME_COLOR[state])}>KAI</span>
          <p className="text-small font-medium text-foreground">{message}</p>
          {options.description ? <p className="text-caption text-muted-foreground">{options.description}</p> : null}
          {options.action ? (
            <button
              type="button"
              onClick={async () => {
                await options.action!.onClick();
                toast.dismiss(id);
              }}
              className="mt-1 self-start text-caption font-semibold text-brand hover:underline"
            >
              {options.action.label}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          aria-label="Cerrar"
          className="-m-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    ),
    { duration: options.duration ?? 6000, unstyled: true, classNames: { toast: "w-[min(22rem,calc(100vw-2rem))]" } },
  );
}
