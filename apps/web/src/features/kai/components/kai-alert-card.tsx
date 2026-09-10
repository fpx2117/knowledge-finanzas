"use client";

import {
  ArrowRightIcon,
  BarChart3Icon,
  CarIcon,
  Gamepad2Icon,
  HomeIcon,
  ShoppingCartIcon,
  UtensilsIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";

import type { KaiProactiveMessage, KaiVisualState } from "@know-finanzas/kai";

import { cn } from "@/lib/utils";
import { KaiAvatar } from "./kai-avatar";

const PILL: Record<KaiVisualState, string> = {
  NEUTRAL: "bg-brand-subtle text-brand",
  ANALYTICAL: "bg-[var(--color-kai-analytical-soft)] text-[var(--color-kai-analytical)]",
  ALERT: "bg-warning-soft text-[var(--warning)]",
  POSITIVE: "bg-success-soft text-[var(--success)]",
};
const DOT: Record<KaiVisualState, string> = {
  NEUTRAL: "bg-brand",
  ANALYTICAL: "bg-[var(--color-kai-analytical)]",
  ALERT: "bg-[var(--warning)]",
  POSITIVE: "bg-[var(--success)]",
};
const BAR_RAMP = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

const CATEGORY_ICON: { match: RegExp; icon: LucideIcon }[] = [
  { match: /vivienda|alquiler|hogar|casa/i, icon: HomeIcon },
  { match: /aliment|comida|super|resta/i, icon: UtensilsIcon },
  { match: /transporte|nafta|auto|combustible/i, icon: CarIcon },
  { match: /entreten|ocio|juego|streaming/i, icon: Gamepad2Icon },
  { match: /compra|shopping|indument/i, icon: ShoppingCartIcon },
];
function iconFor(label: string): LucideIcon {
  return CATEGORY_ICON.find((c) => c.match.test(label))?.icon ?? BarChart3Icon;
}

/**
 * KAI proactive alert card — the floating notification KAI shows on its own (spec §7).
 * Pixel-faithful to the design mockups: mascot + state pill, title, body, optional inline bar
 * breakdown, a filled primary + outlined secondary action, and a small footer meta line.
 */
export function KaiAlertCard({
  message,
  onNavigate,
  onDismiss,
  onOpen,
}: {
  message: KaiProactiveMessage;
  onNavigate: (route: string) => void;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  const chart = message.data?.chart;
  const total = chart ? Number(chart.total) : 0;

  return (
    <div className="relative w-[min(360px,calc(100vw-2rem))]">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
        className="kai-rise flex flex-col rounded-[var(--radius-xl)] border border-border bg-card p-4 text-left shadow-[var(--shadow-floating)]"
      >
        {/* header */}
        <div className="flex items-center gap-2">
          <KaiAvatar state={message.state} size={30} />
          <span className="text-small font-bold text-foreground">KAI</span>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption font-semibold", PILL[message.state])}>
            <span className={cn("size-1.5 rounded-full", DOT[message.state])} aria-hidden />
            {message.stateLabel}
          </span>
          <button
            type="button"
            aria-label="Descartar"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* title + body */}
        <h3 className="mt-3 text-h3 font-bold leading-snug text-foreground">{message.title}</h3>
        <p className="mt-1.5 text-small leading-relaxed text-foreground-secondary">{message.body}</p>

        {/* optional bar breakdown */}
        {chart && chart.segments.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2.5 rounded-xl bg-secondary/60 p-3">
            {chart.segments.map((s, i) => {
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              const Icon = iconFor(s.label);
              return (
                <div key={i} className="flex items-center gap-2.5 text-small">
                  <Icon className="size-4 shrink-0 text-foreground-muted" aria-hidden />
                  <span className="flex-1 truncate text-foreground-secondary">{s.label}</span>
                  <span className="w-9 shrink-0 text-right font-semibold tabular-nums text-foreground">{pct}%</span>
                  <span className="h-2 flex-[1.6] overflow-hidden rounded-full bg-[var(--border)]">
                    <span
                      className="kai-bar block h-full rounded-full"
                      style={{ width: `${Math.max(4, pct)}%`, background: BAR_RAMP[i % BAR_RAMP.length], animationDelay: `${i * 80}ms` }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* actions */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(message.primary.route);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-small font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {message.primary.label}
            <ArrowRightIcon className="size-4" />
          </button>
          {message.secondary ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(message.secondary!.route);
              }}
              className="inline-flex w-full items-center justify-center rounded-full border border-brand-border py-2.5 text-small font-semibold text-brand transition-colors hover:bg-brand-subtle"
            >
              {message.secondary.label}
            </button>
          ) : null}
        </div>

        {/* footer meta */}
        <div className="mt-3 flex items-center gap-1.5 text-caption text-muted-foreground">
          <BarChart3Icon className="size-3.5" aria-hidden />
          {message.meta}
        </div>

        {/* speech-bubble tail toward the floating mascot */}
        <span className="absolute -bottom-1.5 right-9 size-3 rotate-45 border-b border-r border-border bg-card" aria-hidden />
      </div>

      {/* large glowing mascot */}
      <div className="pointer-events-none absolute -bottom-9 right-1 z-10">
        <KaiAvatar state={message.state} size={72} glow />
      </div>
    </div>
  );
}
