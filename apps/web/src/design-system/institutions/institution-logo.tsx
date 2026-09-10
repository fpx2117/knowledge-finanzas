import { cn } from "@/lib/utils";
import { FinanceIcon } from "@/design-system/icons/finance-icon";
import { BrandLogoImg } from "@/components/shared/brand-logo-img";
import { brandLogoUrl } from "@/lib/brand-logo";
import { getInstitution, type InstitutionTone } from "./institutions";

export type InstitutionLogoSize = "sm" | "md" | "lg";

const SIZE: Record<InstitutionLogoSize, { box: string; text: string; radius: string; px: number }> = {
  sm: { box: "size-7", text: "text-[10px]", radius: "rounded-md", px: 28 },
  md: { box: "size-9", text: "text-xs", radius: "rounded-lg", px: 36 },
  lg: { box: "size-11", text: "text-sm", radius: "rounded-lg", px: 44 },
};

// Identity tints — a stable way to tell institutions apart in a list. These are
// NOT trademark colours; they come from Tailwind's neutral-ish scale.
const TONE: Record<InstitutionTone, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-800",
  violet: "bg-violet-100 text-violet-700",
};

/**
 * Brand-level identity for a financial institution — kept separate from the
 * concept-level `FinanceIcon`. Prefers, in order: a bundled official SVG
 * (`public/brand/institutions/<id>.svg` + `hasLogo`), a logo.dev mark for the
 * institution's domain (when `NEXT_PUBLIC_LOGO_DEV_TOKEN` is set), then a monogram
 * chip. An unknown id falls back to a generic bank glyph.
 *
 *   <InstitutionLogo institution="galicia" size="md" />
 */
export function InstitutionLogo({
  institution,
  size = "md",
  className,
}: {
  institution: string;
  size?: InstitutionLogoSize;
  className?: string;
}) {
  const entry = getInstitution(institution);
  const dims = SIZE[size];

  if (!entry) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-flex shrink-0 items-center justify-center bg-secondary text-muted-foreground", dims.box, dims.radius, className)}
      >
        <FinanceIcon name="bank" size={size === "lg" ? "md" : "sm"} className="text-current" />
      </span>
    );
  }

  const monogram = (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold tabular-nums tracking-tight",
        dims.box,
        dims.radius,
        dims.text,
        TONE[entry.tone],
        className,
      )}
    >
      {entry.monogram}
    </span>
  );

  const imageClass = cn(
    "p-1 outline outline-1 -outline-offset-1 outline-border",
    dims.box,
    dims.radius,
    className,
  );

  if (entry.hasLogo) {
    return (
      // next/image adds no value for a tiny static brand SVG (SVGs aren't optimised).
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/brand/institutions/${entry.id}.svg`} alt="" aria-hidden="true" className={cn("bg-card object-contain", imageClass)} />
    );
  }

  const logoDevUrl = brandLogoUrl(entry.domain, { size: dims.px });
  if (logoDevUrl) {
    return <BrandLogoImg src={logoDevUrl} fallback={monogram} className={imageClass} />;
  }

  return monogram;
}
