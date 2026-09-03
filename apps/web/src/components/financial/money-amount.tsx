import { getCurrencyMetadata } from "@know-finanzas/finance";

import { cn } from "@/lib/utils";

type MoneyTone = "auto" | "neutral" | "positive" | "negative" | "muted";

export type MoneyAmountProps = {
  /** Decimal string from the domain layer, e.g. "1234.50" or "-220.00". */
  amount: string;
  currency: string;
  /** "full" shows every decimal; "compact" drops the fraction for whole amounts. */
  variant?: "full" | "compact";
  /** Force a sign. "auto" shows "-" for negatives only; "always" also shows "+". */
  sign?: "auto" | "always";
  /**
   * Colour treatment. "auto" derives from the number's sign (green +/red -),
   * per visual-design-personal.md §16 — but never rely on colour alone (§21).
   */
  tone?: MoneyTone;
  className?: string;
};

const TONE_CLASS: Record<Exclude<MoneyTone, "auto">, string> = {
  neutral: "text-foreground",
  positive: "text-[var(--success)]",
  negative: "text-[var(--negative)]",
  muted: "text-muted-foreground",
};

/**
 * Renders a money value with grouped thousands, the currency's own decimal
 * places, tabular numerals, and the currency code and amount kept on one line
 * (visual-design-personal.md §5.4).
 */
export function MoneyAmount({
  amount,
  currency,
  variant = "full",
  sign = "auto",
  tone = "neutral",
  className,
}: MoneyAmountProps) {
  const decimalPlaces = getCurrencyMetadata(currency).decimalPlaces;
  const negative = amount.trimStart().startsWith("-");
  const [integerRaw, fractionRaw = ""] = amount.replace("-", "").split(".");

  const groupedInteger = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const isWhole = /^0*$/.test(fractionRaw);
  const showFraction = decimalPlaces > 0 && !(variant === "compact" && isWhole);
  const formattedFraction = showFraction ? `,${fractionRaw.padEnd(decimalPlaces, "0").slice(0, decimalPlaces)}` : "";

  const signGlyph = negative ? "−" : sign === "always" ? "+" : "";

  const resolvedTone: Exclude<MoneyTone, "auto"> =
    tone === "auto" ? (negative ? "negative" : "positive") : tone;

  return (
    <span className={cn("tabular-nums whitespace-nowrap", TONE_CLASS[resolvedTone], className)}>
      {signGlyph}
      {currency}&nbsp;{groupedInteger}
      {formattedFraction}
    </span>
  );
}
