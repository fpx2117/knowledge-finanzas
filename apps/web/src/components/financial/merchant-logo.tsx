import { BrandLogoImg } from "@/components/shared/brand-logo-img";
import { brandLogoUrl } from "@/lib/brand-logo";
import { cn } from "@/lib/utils";

/**
 * A merchant's brand mark (via logo.dev, keyed by `domain`), falling back to a lettered chip when
 * there's no domain, no token, or the logo fails to load. `className` sizes the box (e.g. `size-9`).
 */
export function MerchantLogo({
  name,
  domain,
  className,
}: {
  name: string;
  domain?: string | null;
  className?: string;
}) {
  const box = cn(
    "grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-card",
    className,
  );
  const initial = (name.trim()[0] ?? "•").toUpperCase();

  return (
    <BrandLogoImg
      src={brandLogoUrl(domain, { size: 40 })}
      alt=""
      className={cn(box, "object-contain p-1")}
      fallback={
        <span className={cn(box, "text-caption font-bold text-foreground-secondary")}>{initial}</span>
      }
    />
  );
}
