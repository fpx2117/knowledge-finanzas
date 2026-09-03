/**
 * Deterministic Spanish (rioplatense) parser for one-line transaction capture.
 * Zero dependencies, zero network, zero cost — the free first pass before any AI
 * fallback. Handles the common shapes:
 *
 *   "gasté 14k en nafta con Galicia"
 *   "pagué 32 mil de internet"
 *   "cobré 1.200.000 de sueldo"
 *   "compré 8500 en Carrefour"
 *   "transferí 50000 a mercado pago"
 *
 * Returns a draft plus a confidence and a list of ambiguities the UI should
 * surface before the user confirms.
 */

export type ParsedTransactionType = "EXPENSE" | "INCOME" | "TRANSFER";

export type ParsedTransaction = {
  type: ParsedTransactionType;
  /** Decimal string, or null if no amount could be read. */
  amount: string | null;
  /** The literal amount token as typed ("14k", "1.200.000"). */
  amountText: string | null;
  /** Best-guess concept / description. */
  description: string;
  /** Raw merchant fragment ("Carrefour", "nafta"), unresolved. */
  merchantText: string | null;
  /** Raw institution fragment ("Galicia", "mercado pago"), unresolved. */
  institutionText: string | null;
  /** 0..1 — how sure the parser is overall. */
  confidence: number;
  ambiguities: string[];
};

const EXPENSE_VERBS = [
  "gaste", "gasté", "pague", "pagué", "compre", "compré", "saque", "saqué",
  "abone", "aboné", "gastamos", "pagamos", "compramos",
];
const INCOME_VERBS = [
  "cobre", "cobré", "cobramos", "facture", "facturé", "recibi", "recibí",
  "ingreso", "ingresó", "entro", "entró", "me pagaron", "me depositaron", "me transfirieron",
];
const TRANSFER_VERBS = ["transferi", "transferí", "pase", "pasé", "movi", "moví", "mande", "mandé"];

// Common services said as a bare noun after "de" — used as both description and a category hint.
const SERVICE_WORDS = ["luz", "gas", "agua", "internet", "cable", "telefono", "teléfono", "expensas", "alquiler", "seguro", "obra social", "prepaga", "nafta", "combustible", "sube"];

const INSTITUTION_HINTS = [
  "galicia", "santander", "bbva", "nacion", "nación", "provincia", "ciudad", "macro",
  "credicoop", "supervielle", "patagonia", "comafi", "hsbc", "icbc", "brubank",
  "mercado pago", "mercadopago", "uala", "ualá", "naranja", "naranja x", "personal pay",
  "lemon", "belo", "prex", "balanz", "iol", "cocos", "ppi",
];

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Lower-case, accents STRIPPED — for keyword matching (verbs, institutions, services). */
function normalize(value: string): string {
  return stripAccents(value.toLowerCase()).replace(/\s+/g, " ").trim();
}

/** Lower-case, accents KEPT — for extracting fragments that become user-facing text. */
function lower(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Parse an Argentine-formatted number token (dots = thousands, comma = decimal) + k/mil/millones. */
function parseAmountToken(token: string): { value: number; text: string } | null {
  const t = token.trim().toLowerCase().replace(/^\$\s*/, "").replace(/\s+/g, " ");

  // 14k · 14 k · 2,5k
  const kMatch = t.match(/^([\d]+(?:[.,]\d+)?)\s*k$/);
  if (kMatch) return { value: Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1000), text: token.trim() };

  // 32 mil · 32mil · 1,5 mil
  const milMatch = t.match(/^([\d]+(?:[.,]\d+)?)\s*mil$/);
  if (milMatch) return { value: Math.round(parseFloat(milMatch[1].replace(",", ".")) * 1000), text: token.trim() };

  // 1.2 millones · 1,5 millon · 3 palos · 2 lucas
  const bigMatch = t.match(/^([\d]+(?:[.,]\d+)?)\s*(millones?|mill|palos?|lucas?)$/);
  if (bigMatch) {
    const factor = /luca/.test(bigMatch[2]) ? 1000 : 1_000_000;
    return { value: Math.round(parseFloat(bigMatch[1].replace(",", ".")) * factor), text: token.trim() };
  }

  // 1.200.000 · 14.500 · 1.200.000,50  (grouped thousands)
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) {
    return { value: parseFloat(t.replace(/\./g, "").replace(",", ".")), text: token.trim() };
  }
  // 14500,50  (decimal comma, no grouping)
  if (/^\d+,\d{1,2}$/.test(t)) return { value: parseFloat(t.replace(",", ".")), text: token.trim() };
  // plain 14500 · 14500.50
  if (/^\d+(\.\d{1,2})?$/.test(t)) return { value: parseFloat(t), text: token.trim() };

  return null;
}

function findAmount(raw: string): { value: number; text: string } | null {
  // Try richer tokens first (with k/mil/millones), then bare numbers.
  const candidates =
    raw.match(/\$?\s*\d[\d.,]*\s*(?:k|mil|millones?|mill|palos?|lucas?)\b/gi) ??
    raw.match(/\$?\s*\d[\d.,]*/g) ??
    [];
  for (const candidate of candidates) {
    const parsed = parseAmountToken(candidate);
    if (parsed && parsed.value > 0) return parsed;
  }
  return null;
}

function detectType(norm: string): { type: ParsedTransactionType; matched: boolean } {
  for (const verb of TRANSFER_VERBS) if (norm.includes(verb)) return { type: "TRANSFER", matched: true };
  for (const verb of INCOME_VERBS) if (norm.includes(normalize(verb))) return { type: "INCOME", matched: true };
  for (const verb of EXPENSE_VERBS) if (norm.includes(verb)) return { type: "EXPENSE", matched: true };
  return { type: "EXPENSE", matched: false };
}

function extractFragment(text: string, preposition: "en" | "de" | "del" | "a" | "con" | "desde"): string | null {
  const re = new RegExp(
    `\\b${preposition}\\s+([a-z0-9áéíóúñ][a-z0-9áéíóúñ .&'-]*?)(?=\\s+(?:con|desde|de|del|el|la|los|las|un|una|ayer|hoy|para|por)\\b|$)`,
    "i",
  );
  const match = text.match(re);
  if (!match) return null;
  const value = match[1].trim();
  return value.length >= 2 ? value : null;
}

function matchInstitution(norm: string): string | null {
  for (const hint of INSTITUTION_HINTS) {
    if (norm.includes(hint)) return hint;
  }
  return null;
}

export function parseTransactionText(raw: string): ParsedTransaction {
  const trimmed = raw.trim();
  const norm = normalize(trimmed);
  const low = lower(trimmed);
  const ambiguities: string[] = [];

  const amount = findAmount(trimmed);
  if (!amount) ambiguities.push("No pude leer un monto.");

  const { type, matched: verbMatched } = detectType(norm);
  if (!verbMatched) ambiguities.push("Asumí que es un gasto.");

  const institutionText = matchInstitution(norm);
  const withFrag = extractFragment(low, "con") ?? extractFragment(low, "desde");

  let merchantText: string | null = null;
  let description = "";

  const enFrag = extractFragment(low, "en");
  const deFrag = extractFragment(low, "del") ?? extractFragment(low, "de");
  const aFrag = type === "TRANSFER" ? extractFragment(low, "a") : null;

  if (enFrag && enFrag !== withFrag) {
    merchantText = enFrag;
    description = enFrag;
  } else if (deFrag && deFrag !== withFrag) {
    const isService = SERVICE_WORDS.some((word) => deFrag.includes(word));
    description = deFrag;
    if (!isService) merchantText = deFrag;
  } else if (aFrag) {
    description = `Transferencia a ${aFrag}`;
  }

  if (!description) {
    // Fall back to the words after the verb, minus the amount and prepositional tails.
    const cleaned = low
      .replace(/\$?\s*\d[\d.,]*\s*(?:k|mil|millones?|mill|palos?|lucas?)?\b/gi, " ")
      .replace(new RegExp(`\\b(${[...EXPENSE_VERBS, ...INCOME_VERBS, ...TRANSFER_VERBS].join("|")})\\b`, "gi"), " ")
      .replace(/\b(con|desde|del|de|en|a|el|la|los|las|un|una|ayer|hoy|para|por|me)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    description = cleaned || (type === "INCOME" ? "Ingreso" : "Gasto");
  }

  description = description.charAt(0).toUpperCase() + description.slice(1);
  // Income has no merchant in this model; the "de X" there is the income concept.
  if (type !== "EXPENSE") merchantText = null;

  let confidence = 0.4;
  if (amount) confidence += 0.35;
  if (verbMatched) confidence += 0.15;
  if (merchantText || institutionText) confidence += 0.1;
  confidence = Math.min(1, Math.round(confidence * 100) / 100);

  return {
    type,
    amount: amount ? amount.value.toFixed(2) : null,
    amountText: amount?.text ?? null,
    description: description.slice(0, 120),
    merchantText: merchantText ? merchantText.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80) : null,
    institutionText,
    confidence,
    ambiguities,
  };
}
