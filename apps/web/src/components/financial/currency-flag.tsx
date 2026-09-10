import * as flagStrings from "country-flag-icons/string/3x2";

import { cn } from "@/lib/utils";

// ISO 4217 currency → ISO 3166-1 alpha-2 country for the flag. Most codes are `<CC><X>`
// (ARS→AR, USD→US, BRL→BR…), handled by the fallback; this map covers the exceptions.
const CURRENCY_COUNTRY: Record<string, string> = {
  EUR: "EU",
  USD: "US",
  GBP: "GB",
  CHF: "CH",
  XOF: "SN",
  XAF: "CM",
  XCD: "AG",
  ANG: "CW",
  AED: "AE",
  DKK: "DK",
};

const FLAGS = flagStrings as unknown as Record<string, string>;

function countryFor(code: string): string | null {
  const upper = code.toUpperCase();
  const country = CURRENCY_COUNTRY[upper] ?? upper.slice(0, 2);
  return FLAGS[country] ? country : null;
}

/**
 * Circular country flag for a currency code (Resumen "Tus cuentas y monedas"). Uses
 * `country-flag-icons` SVGs — resolved on the server, so only the chosen flag ships. Falls
 * back to the ISO code on a neutral disc when there's no flag for the currency.
 */
export function CurrencyFlag({ code, className }: { code: string; className?: string }) {
  const country = countryFor(code);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-secondary",
        className,
      )}
    >
      {country ? (
        <span
          className="block size-full [&>svg]:size-full [&>svg]:scale-[1.35] [&>svg]:object-cover"
          dangerouslySetInnerHTML={{ __html: FLAGS[country] }}
        />
      ) : (
        <span className="text-[10px] font-black text-muted-foreground">{code.slice(0, 3)}</span>
      )}
    </span>
  );
}
