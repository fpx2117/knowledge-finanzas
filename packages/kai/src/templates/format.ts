/**
 * Presentation helpers for KAI templates. Amounts are always formatted in their own
 * currency — KAI never adds figures from different currencies (spec repeatedly:
 * "no cross-currency sums").
 */
export function formatMoney(amount: string, currencyCode: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currencyCode}`;
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currencyCode} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)}`;
  }
}

export function formatPercent(ratio: number): string {
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(ratio)}%`;
}

/** Joins several per-currency amounts as "$X y US$Y" without ever summing them. */
export function formatMoneyList(items: { amount: string; currencyCode: string }[]): string {
  if (items.length === 0) return formatMoney("0", "ARS");
  return items.map((item) => formatMoney(item.amount, item.currencyCode)).join(" y ");
}

/** "2026-09-14" → "14 de septiembre". */
export function formatDayMonth(localDate: string): string {
  const [, month, day] = localDate.split("-").map(Number);
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${day} de ${months[(month - 1) % 12]}`;
}
