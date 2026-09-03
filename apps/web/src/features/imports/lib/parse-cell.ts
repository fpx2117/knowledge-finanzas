// Locale-tolerant amount + date parsing for imported rows. Pure.

/**
 * Parse a money cell into a number. Handles "1.234,56" (AR), "1,234.56" (US), "1234.56",
 * parenthesised negatives "(1.234,56)", trailing sign, and CR/DB markers. Returns null on
 * anything that isn't a number.
 */
export function parseImportedAmount(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }
  if (/(^-|-$)/.test(s)) {
    negative = true;
    s = s.replace(/^-|-$/g, "").trim();
  }
  if (/\b(DB|D)\b/i.test(s) && !/\b(CR|C)\b/i.test(s)) negative = true;
  s = s.replace(/[^\d.,-]/g, "").replace(/-/g, "");
  if (!s || !/\d/.test(s)) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let decimalSep: "," | "." | null = null;
  if (lastComma !== -1 && lastDot !== -1) {
    decimalSep = lastComma > lastDot ? "," : ".";
  } else if (lastComma !== -1) {
    decimalSep = /,\d{1,2}$/.test(s) ? "," : null;
  } else if (lastDot !== -1) {
    decimalSep = /\.\d{1,2}$/.test(s) && (s.match(/\./g) ?? []).length === 1 ? "." : null;
  }

  let normalized: string;
  if (decimalSep === ",") normalized = s.replace(/\./g, "").replace(",", ".");
  else if (decimalSep === ".") normalized = s.replace(/,/g, "");
  else normalized = s.replace(/[.,]/g, "");

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/**
 * Parse a date cell into an ISO "YYYY-MM-DD". Handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD,
 * DD/MM/YY, and DD MMM YYYY (Spanish month abbreviations). Day-first is assumed for ambiguous
 * numeric dates (Argentine convention).
 */
const ES_MONTHS: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12,
};

export function parseImportedDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const numeric = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/.exec(s);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    let year = Number(numeric[3]);
    if (year < 100) year += year > 70 ? 1900 : 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const named = /^(\d{1,2})[\s/\-]+([a-záéíóú]{3,})[\s/\-]+(\d{2,4})/i.exec(s);
  if (named) {
    const month = ES_MONTHS[named[2].toLowerCase().slice(0, 3)];
    if (!month) return null;
    let year = Number(named[3]);
    if (year < 100) year += year > 70 ? 1900 : 2000;
    return `${year}-${String(month).padStart(2, "0")}-${String(Number(named[1])).padStart(2, "0")}`;
  }

  return null;
}
