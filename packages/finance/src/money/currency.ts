export const currencyMetadata = {
  ARS: { code: "ARS", decimalPlaces: 2 },
  BRL: { code: "BRL", decimalPlaces: 2 },
  CLP: { code: "CLP", decimalPlaces: 0 },
  EUR: { code: "EUR", decimalPlaces: 2 },
  GBP: { code: "GBP", decimalPlaces: 2 },
  JPY: { code: "JPY", decimalPlaces: 0 },
  MXN: { code: "MXN", decimalPlaces: 2 },
  USD: { code: "USD", decimalPlaces: 2 },
  UYU: { code: "UYU", decimalPlaces: 2 },
} as const;

export type CurrencyCode = keyof typeof currencyMetadata;

export function getCurrencyMetadata(code: string) {
  if (!(code in currencyMetadata)) {
    throw new Error(`Unsupported currency: ${code}`);
  }

  return currencyMetadata[code as CurrencyCode];
}
