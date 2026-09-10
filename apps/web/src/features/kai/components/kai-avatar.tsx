import type { KaiVisualState } from "@know-finanzas/kai";

import { cn } from "@/lib/utils";

const SRC: Record<KaiVisualState, string> = {
  NEUTRAL: "/brand/kai/kai-neutral.png",
  ANALYTICAL: "/brand/kai/kai-analytical.png",
  ALERT: "/brand/kai/kai-alert.png",
  POSITIVE: "/brand/kai/kai-positive.png",
};

const GLOW: Record<KaiVisualState, string> = {
  NEUTRAL: "drop-shadow(0 0 16px rgb(23 55 200 / 0.35))",
  ANALYTICAL: "drop-shadow(0 0 16px rgb(60 90 230 / 0.40))",
  ALERT: "drop-shadow(0 0 16px rgb(240 150 20 / 0.45))",
  POSITIVE: "drop-shadow(0 0 16px rgb(35 160 110 / 0.45))",
};

/**
 * KAI's face — the mascot. The crescent arc, glossy shell and visor colour are baked into the
 * PNG per state (`kai-{state}.png`); we render it bare (transparent, `object-contain`) so it
 * matches the design mockups exactly. `glow` adds the state-coloured halo used for the large
 * floating mascot on proactive alerts.
 */
export function KaiAvatar({
  state = "NEUTRAL",
  size = 32,
  processing = false,
  glow = false,
  className,
}: {
  state?: KaiVisualState;
  size?: number;
  processing?: boolean;
  glow?: boolean;
  className?: string;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={SRC[state]}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 select-none object-contain", processing && "animate-pulse", className)}
      style={{ width: size, height: size, filter: glow ? GLOW[state] : undefined }}
      draggable={false}
    />
  );
}
