/**
 * Icon design tokens. Every size and colour decision for iconography lives here,
 * not in the component and never per-call. Colours resolve to the app's CSS
 * custom properties (globals.css) so light/future-dark stay coherent.
 */

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconVariant = "default" | "muted" | "brand" | "success" | "warning" | "danger" | "info";
export type IconContainerSize = "sm" | "md" | "lg";

/** Pixel size per semantic step — matches the 14–24px legibility target (32 for hero). */
export const ICON_SIZE_PX: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/** Stroke width scales slightly down as the glyph grows, so weight reads even. */
export const ICON_STROKE_WIDTH: Record<IconSize, number> = {
  xs: 1.75,
  sm: 1.75,
  md: 1.5,
  lg: 1.5,
  xl: 1.5,
};

/** Text colour token per variant — Tailwind utilities backed by CSS vars. */
export const ICON_VARIANT_CLASS: Record<IconVariant, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  brand: "text-brand",
  success: "text-[var(--success)]",
  warning: "text-[var(--warning)]",
  danger: "text-[var(--negative)]",
  info: "text-[var(--info)]",
};

/** Soft-fill surface + icon colour for FinanceIconContainer, per variant. */
export const ICON_CONTAINER_VARIANT_CLASS: Record<IconVariant, string> = {
  default: "bg-secondary text-foreground-secondary",
  muted: "bg-secondary text-muted-foreground",
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-soft text-[var(--success)]",
  warning: "bg-warning-soft text-[var(--warning)]",
  danger: "bg-negative-soft text-[var(--negative)]",
  info: "bg-brand-subtle text-[var(--info)]",
};

/** Container box size + the icon size it holds. Radius stays concentric (~1/3). */
export const ICON_CONTAINER: Record<IconContainerSize, { box: string; radius: string; icon: IconSize }> = {
  sm: { box: "size-8", radius: "rounded-md", icon: "sm" },
  md: { box: "size-9", radius: "rounded-lg", icon: "md" },
  lg: { box: "size-10", radius: "rounded-lg", icon: "md" },
};
