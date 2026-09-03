import { cn } from "@/lib/utils";
import { FinanceIcons, type FinanceIconName } from "./finance-icons";
import {
  ICON_SIZE_PX,
  ICON_STROKE_WIDTH,
  ICON_VARIANT_CLASS,
  type IconSize,
  type IconVariant,
} from "./icon-tokens";

export type FinanceIconProps = {
  /** A concept from the curated set — invalid names fail at compile time. */
  name: FinanceIconName;
  size?: IconSize;
  variant?: IconVariant;
  className?: string;
  /**
   * Decorative by default (`aria-hidden`). Pass a label to expose the icon to
   * assistive tech when it is the only carrier of meaning.
   */
  "aria-label"?: string;
  title?: string;
};

/**
 * The one icon primitive. Renders a lucide glyph from the curated map at a
 * semantic size + variant colour. Colour comes from `currentColor`, so it also
 * inherits from a parent when `variant` is left default.
 *
 *   <FinanceIcon name="creditCard" size="md" variant="brand" />
 */
export function FinanceIcon({
  name,
  size = "md",
  variant = "default",
  className,
  "aria-label": ariaLabel,
  title,
}: FinanceIconProps) {
  const Glyph = FinanceIcons[name];
  const px = ICON_SIZE_PX[size];

  return (
    <Glyph
      width={px}
      height={px}
      strokeWidth={ICON_STROKE_WIDTH[size]}
      className={cn("shrink-0", ICON_VARIANT_CLASS[variant], className)}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      focusable={false}
    >
      {title ? <title>{title}</title> : null}
    </Glyph>
  );
}
