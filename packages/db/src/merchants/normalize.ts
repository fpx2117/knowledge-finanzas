// Shared merchant-string normalization — used at seed time and at resolve time so the same raw
// string always produces the same lookup key. Lower-case, strip accents, drop store numbers and
// common corporate-suffix noise, collapse whitespace.

const NOISE_TOKENS = new Set([
  "sa", "s.a", "s.a.", "srl", "s.r.l", "s.r.l.", "sas", "saci", "sacif", "cicsa",
  "arg", "argentina", "bs", "as", "caba", "suc", "sucursal", "local", "pago", "compra",
  "debito", "credito", "tarjeta", "visa", "master", "mastercard", "mercpago", "mp",
]);

export function normalizeMerchant(raw: string): string {
  const base = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s.+/-]/g, " ")
    .replace(/\b\d{2,}\b/g, " ") // store / terminal numbers
    .replace(/\s+/g, " ")
    .trim();

  const kept = base
    .split(" ")
    .filter((token) => token.length > 0 && !NOISE_TOKENS.has(token.replace(/\.+$/, "")))
    .join(" ")
    .trim();

  return kept.length > 0 ? kept : base;
}
