import { cn } from "@/lib/utils";
import { FinanceIcon } from "./finance-icon";
import type { FinanceIconName } from "./finance-icons";
import { ICON_CONTAINER, ICON_CONTAINER_VARIANT_CLASS, type IconContainerSize, type IconVariant } from "./icon-tokens";

export type FinanceIconContainerProps = {
  icon: FinanceIconName;
  size?: IconContainerSize;
  variant?: IconVariant;
  className?: string;
  "aria-label"?: string;
};

/**
 * An icon inside a soft-fill rounded square — the standard "product token" used
 * in list rows, KPI cards and dropdown items. Box size, radius and the icon size
 * it holds are all fixed by `ICON_CONTAINER` so nested corners stay concentric.
 *
 *   <FinanceIconContainer icon="creditCard" size="md" variant="brand" />
 */
export function FinanceIconContainer({
  icon,
  size = "md",
  variant = "brand",
  className,
  "aria-label": ariaLabel,
}: FinanceIconContainerProps) {
  const box = ICON_CONTAINER[size];

  return (
    <span
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        box.box,
        box.radius,
        ICON_CONTAINER_VARIANT_CLASS[variant],
        className,
      )}
    >
      <FinanceIcon name={icon} size={box.icon} variant="default" className="text-current" />
    </span>
  );
}
