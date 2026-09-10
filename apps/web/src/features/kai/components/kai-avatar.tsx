import type { KaiVisualState } from "@know-finanzas/kai";

import { cn } from "@/lib/utils";

const SRC: Record<KaiVisualState, string> = {
  NEUTRAL: "/brand/kai/kai-neutral.png",
  ANALYTICAL: "/brand/kai/kai-analytical.png",
  ALERT: "/brand/kai/kai-alert.png",
  POSITIVE: "/brand/kai/kai-positive.png",
};

const RING: Record<KaiVisualState, string> = {
  NEUTRAL: "ring-[var(--color-kai-neutral)]/30 bg-[var(--color-kai-neutral-soft)]",
  ANALYTICAL: "ring-[var(--color-kai-analytical)]/30 bg-[var(--color-kai-analytical-soft)]",
  ALERT: "ring-[var(--color-kai-alert)]/35 bg-[var(--color-kai-alert-soft)]",
  POSITIVE: "ring-[var(--color-kai-positive)]/35 bg-[var(--color-kai-positive-soft)]",
};

/**
 * KAI's face. Same geometry across states (spec §5) — only the image expression, the accent
 * ring and a subtle pulse when processing change.
 */
export function KaiAvatar({
  state = "NEUTRAL",
  size = 32,
  processing = false,
  className,
}: {
  state?: KaiVisualState;
  size?: number;
  processing?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 transition-colors duration-[var(--motion-duration-base)]",
        RING[state],
        processing && "animate-pulse",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* Plain <img>, like BrandLogoImg — avoids the next/image optimizer for a tiny local asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SRC[state]} alt="" width={size} height={size} className="size-full object-cover" />
    </span>
  );
}
