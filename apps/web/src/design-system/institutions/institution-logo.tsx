import { cn } from "@/lib/utils";
import { FinanceIcon } from "@/design-system/icons/finance-icon";
import { getInstitution, type InstitutionTone } from "./institutions";

export type InstitutionLogoSize = "sm" | "md" | "lg";

const SIZE: Record<InstitutionLogoSize, { box: string; text: string; radius: string }> = {
  sm: { box: "size-7", text: "text-[10px]", radius: "rounded-md" },
  md: { box: "size-9", text: "text-xs", radius: "rounded-lg" },
  lg: { box: "size-11", text: "text-sm", radius: "rounded-lg" },
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
 * concept-level `FinanceIcon`. Renders the official logo when one has been added
 * to `public/brand/institutions/<id>.svg` (and `hasLogo` is set in the
 * registry); otherwise a monogram chip. An unknown id falls back to a generic
 * bank glyph. Never invents or recreates a brand mark.
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

  if (entry.hasLogo) {
    return (
      // next/image adds no value for a tiny static brand SVG (SVGs aren't optimised).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/brand/institutions/${entry.id}.svg`}
        alt=""
        aria-hidden="true"
        className={cn(
          "shrink-0 bg-card object-contain p-1 outline outline-1 -outline-offset-1 outline-border",
          dims.box,
          dims.radius,
          className,
        )}
      />
    );
  }

  return (
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
}
