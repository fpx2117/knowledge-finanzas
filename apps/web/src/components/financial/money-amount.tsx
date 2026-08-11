import { getCurrencyMetadata } from "@know-finanzas/finance";

export function MoneyAmount({ amount, currency }: { amount: string; currency: string }) {
  const decimalPlaces = getCurrencyMetadata(currency).decimalPlaces;
  const [integerPart, fractionPart = ""] = amount.split(".");
  const sign = integerPart.startsWith("-") ? "-" : "";
  const unsignedInteger = integerPart.replace("-", "");
  const groupedInteger = unsignedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formattedFraction = decimalPlaces > 0 ? `,${fractionPart.padEnd(decimalPlaces, "0")}` : "";

  return <span>{currency} {sign}{groupedInteger}{formattedFraction}</span>;
}
