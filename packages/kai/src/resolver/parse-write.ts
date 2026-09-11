/**
 * Deterministic parser for write-intent messages (spec §11 Action Cards). Recognises
 * "creá / registrá / anotá un gasto|ingreso …" and "gasté N en …" and pulls out the amount
 * and a merchant/description — with **no LLM**. KAI then shows a `KAI_CONFIRMATION` the user
 * approves before anything is written.
 */
export type KaiWriteIntent = {
  kind: "CREATE_EXPENSE" | "CREATE_INCOME";
  /** Decimal string, or null when no amount could be read (KAI opens the form instead). */
  amount: string | null;
  /** "USD" when the message named dollars; null → the account's own currency. */
  currencyHint: "USD" | null;
  /** Non-empty description for the transaction (merchant name, or "Gasto" / "Ingreso"). */
  description: string;
  /** The merchant/counterparty fragment, when distinguishable from the description. */
  merchant: string | null;
};

const CREATE_VERB = /\b(crea|cre[aá]s?|creame|registr\w+|anot\w+|agreg\w+|carg\w+|met[eé]|pon[eé]|añad\w+|sum[aá])\b/;
const EXPENSE_NOUN = /\b(gasto|gastos|compra|compras|pago|pagos)\b/;
const INCOME_NOUN = /\b(ingreso|ingresos|cobro|cobros|entrada|dep[oó]sito|deposito)\b/;
const SPENT_VERB = /\b(gast[eé]|pagu[eé]|compr[eé]|abon[eé])\b/;
const SPENT_COLLOQUIAL = /\bse me (fueron|fue|van|va)\b/;
const EARNED_VERB = /\b(cobr[eé]|ingres[eé]|recib[ií]|me pagaron|me depositaron)\b/;

const FILLER = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "en", "por", "para",
  "mi", "mis", "a", "al", "que", "con", "y", "e", "the", "gasto", "ingreso", "pago", "compra",
  "cobro", "hoy", "ayer", "ahora", "algo", "cosas", "cosa",
]);

/** Parses "$30.000", "30.000", "30000", "30 mil", "1,5 millones", "30k", "usd 50", "us$ 50". */
export function parseAmount(text: string): { amount: string | null; currencyHint: "USD" | null } {
  const currencyHint = /(\busd\b|u\$s|us\$|d[oó]lar\w*)/.test(text) ? ("USD" as const) : null;

  // AR slang: "5 lucas" = 5.000, "2 palos" = 2.000.000, "30k" = 30.000.
  const scaled = /(\d+(?:[.,]\d+)?)\s*(mil|millon\w*|lucas?|palos?|k|m)\b/.exec(text);
  if (scaled) {
    const base = Number(scaled[1].replace(",", "."));
    const unit = scaled[2].toLowerCase();
    const factor = unit === "m" || /^(millon|palo)/.test(unit) ? 1_000_000 : 1_000;
    if (Number.isFinite(base)) return { amount: String(Math.round(base * factor)), currencyHint };
  }

  // Bare number, Argentine grouping: "." = thousands, "," = decimals.
  const bare = /(?:\$|usd|u\$s|us\$)?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)/.exec(text);
  if (bare) {
    let raw = bare[1];
    if (raw.includes(".") && raw.includes(",")) raw = raw.replace(/\./g, "").replace(",", ".");
    else if (/\.\d{3}(\D|$)/.test(`${raw} `) || /\.\d{3}$/.test(raw)) raw = raw.replace(/\./g, "");
    else raw = raw.replace(",", ".");
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) return { amount: String(value), currencyHint };
  }

  return { amount: null, currencyHint };
}

export function parseWriteIntent(normalized: string, raw: string): KaiWriteIntent | null {
  // A number followed by veces / días / meses / % / lugares / cuotas is a count, not money —
  // "gasté 3 veces", "cuánto gasté los últimos 3 meses" are NOT write commands.
  const numberIsCount = /\b\d{1,3}\s*(veces?|dias?|semanas?|meses|anos?|%|por ?ciento|lugares?|cuotas?|productos?)\b/.test(normalized);

  // Parse the amount from the raw text — `normalized` has stripped the "." and "," that
  // Argentine number formatting relies on ("$30.000").
  const { amount, currencyHint } = parseAmount(raw.toLowerCase());
  // Treat it as a real amount only if it's ≥ 1000 or the text carries a currency marker
  // (below AR$1000 buys nothing; a bare "50" is almost always "50%" / "50 veces").
  const hasMoney =
    !numberIsCount &&
    amount !== null &&
    (Number(amount) >= 1000 || /(\$|usd|u\$s|us\$|pesos?|mangos?|mil|millon|luca|palo)/i.test(raw));

  const hasCreateVerb = CREATE_VERB.test(normalized);
  const isExpense =
    (hasCreateVerb && EXPENSE_NOUN.test(normalized)) ||
    (SPENT_VERB.test(normalized) && hasMoney) ||
    (SPENT_COLLOQUIAL.test(normalized) && hasMoney) ||
    /\b(un|una)?\s*(gasto|compra|pago) de\b/.test(normalized);
  const isIncome =
    (hasCreateVerb && INCOME_NOUN.test(normalized)) ||
    (EARNED_VERB.test(normalized) && hasMoney) ||
    /\b(un|una)?\s*(ingreso|cobro) de\b/.test(normalized);

  if (!isExpense && !isIncome) return null;
  const kind = isIncome && !isExpense ? "CREATE_INCOME" : "CREATE_EXPENSE";

  // Merchant/description: drop verbs, nouns and the amount, then take the tail after "en"/"de".
  let rest = normalized
    .replace(CREATE_VERB, " ")
    .replace(EXPENSE_NOUN, " ")
    .replace(INCOME_NOUN, " ")
    .replace(SPENT_VERB, " ")
    .replace(SPENT_COLLOQUIAL, " ")
    .replace(EARNED_VERB, " ")
    .replace(/quiero|necesito|por favor|porfa|dale|que|anota|registra/g, " ")
    // normalized has no "." / "," so amounts are space-separated digit groups ("30 000").
    .replace(/\b\d[\d]*\b/g, " ")
    .replace(/\b(mil|millon\w*|lucas?|palos?|k|usd|u\$s|us\$|d[oó]lar\w*|pesos?|mangos?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  rest = rest.replace(/[$]/g, " ").replace(/\s+/g, " ").trim();
  const enMatch = /(?:\ben\b|\bde\b|\bpara\b|\bpor\b|\ba\b)\s+(.+)$/.exec(rest);
  if (enMatch) rest = enMatch[1];

  const words = rest.split(" ").filter((w) => w && !FILLER.has(w) && /[a-z0-9]/.test(w));
  const merchantFromNormalized = words.slice(0, 3).join(" ").trim();

  // Recover original casing from the raw message for a nicer label.
  const merchant = merchantFromNormalized ? recoverCasing(merchantFromNormalized, raw) : null;

  const description = merchant || (kind === "CREATE_INCOME" ? "Ingreso" : "Gasto");
  return { kind, amount, currencyHint, description, merchant };
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Finds `normalizedPhrase` (lower-case, no accents) inside `raw` and returns it with the
 * original casing — nicer than the all-lowercase result of `normalizeText` for a label that
 * doesn't have a real record to correct it against (a brand-new goal name; a merchant/account
 * that already exists gets its casing from the matched record instead).
 */
function recoverCasing(normalizedPhrase: string, raw: string): string {
  const rawWords = raw.split(/\s+/);
  const first = normalizedPhrase.split(" ")[0];
  const matched = rawWords.find((w) => stripAccents(w.toLowerCase()).replace(/[^a-z0-9]/g, "") === first);
  if (!matched) return normalizedPhrase;
  return rawWords
    .slice(rawWords.indexOf(matched), rawWords.indexOf(matched) + normalizedPhrase.split(" ").length)
    .join(" ")
    .replace(/[.,;:]+$/, "");
}

/**
 * Action intents beyond create-a-movement (spec §11): moving money to a goal, undoing a
 * movement. Checked before `parseWriteIntent` — more specific. Returns null if none match.
 */
export type KaiActionIntent =
  | { kind: "ALLOCATE_TO_GOAL"; amount: string | null; goalName: string }
  | { kind: "VOID_LAST"; ofType: "EXPENSE" | "INCOME" | null }
  | { kind: "VOID_MERCHANT"; merchant: string }
  | { kind: "PAY_OBLIGATION"; obligationName: string }
  | { kind: "CREATE_TRANSFER"; amount: string | null; fromAccountName: string; toAccountName: string }
  | { kind: "EDIT_TRANSACTION_CATEGORY"; mode: "last" | "merchant"; merchant?: string; categoryName: string }
  | { kind: "CREATE_GOAL"; name: string; amount: string | null; currencyHint: "USD" | null }
  | { kind: "CREATE_BUDGET"; categoryName: string; amount: string | null; currencyHint: "USD" | null };

const ALLOCATE_VERB = /\b(aport[aáeé]\w*|mov[eé]\w*|mon[eé]\w*|pas[aá]\w*|guard[aá]\w*|transferi\w*|deposit[aá]\w*|sum[aá]\w* .*\bmeta\b)/;
const VOID_VERB = /\b(anul[aá]\w*|borr[aá]\w*|elimin[aá]\w*|deshac[eé]\w*|dar de baja|da de baja)/;
// Mismos verbos de "mover plata" que ALLOCATE_VERB, pero sin meta/objetivo/ahorro y con
// estructura "de {cuenta} a {cuenta}" — una transferencia entre cuentas propias, no un aporte.
const TRANSFER_VERB = /\b(transferi\w*|pas[aá]\w*|mov[eé]\w*)\b/;
const TRANSFER_SHAPE = /\bde\s+(?:la\s+|el\s+|mi\s+)?(.+?)\s+(?:a|hacia|al)\s+(?:la\s+|el\s+|mi\s+)?(.+)$/;
// "cuota" al lado del verbo de pago distingue "pagué la cuota del auto" (una obligación) de
// "pagué luz $5.000" (un gasto nuevo, spec §11 CREATE_EXPENSE) — sin monto que confundir.
const PAY_OBLIGATION_VERB = /\b(pagu[eé]\w*|pag[aá]\w*|abon[eé]\w*|abon[aá]\w*)\b/;
const OBLIGATION_NOUN = /\b(cuota|cuotas|tarjeta|prestamo|deuda|obligacion)\b/;
// "cambiá/corregí la categoría de {movimiento} a {categoría}" — la única edición que el propio
// servicio de transacciones soporta es de metadata (categoría/comercio/nota), nunca el monto
// (spec 14 §9: corregir un monto se hace anulando y creando de nuevo, no editando el ledger).
const EDIT_CATEGORY_VERB = /\b(cambi[aá]\w*|corregi\w*|corrija\w*|actualiz[aá]\w*)\b/;
const EDIT_CATEGORY_SHAPE =
  /\bcategoria\s+(?:del?\s+|de la\s+)?(?:gasto|movimiento|ingreso|compra)?\s*(?:de\s+)?(.*?)\s+a\s+(.+)$/;
// "creá una meta …" / "creá un presupuesto …" — un verbo más acotado que CREATE_VERB (sin
// meté/poné/sumá) para no pisar ALLOCATE_TO_GOAL, que comparte "sumá … meta" (spec §11:
// crear es distinto de aportar a algo que ya existe).
const CREATE_GOAL_OR_BUDGET_VERB = /\b(crea|cre[aá]\w*|creame|registr\w+|agreg\w+|carg\w+)\b/;
const NEW_GOAL_SHAPE = /\b(?:una|un)\s+(?:meta|objetivo)\b/;
const NEW_BUDGET_SHAPE = /\b(?:un|una)\s+presupuesto\b/;

/** Cuts a captured name tail right before a trailing "de {monto}" clause ("comida de 200000" → "comida"). */
function stripTrailingAmount(s: string): string {
  return s.replace(/\s+de\s+\$?\d[\s\S]*$/, "").trim();
}

export function parseActionIntent(normalized: string, raw: string): KaiActionIntent | null {
  // ── transferir entre dos cuentas propias ─────────────────────────────────
  // Chequeado antes de ALLOCATE_TO_GOAL: comparte verbos ("pasá", "moné", "transferí"). Solo
  // "meta"/"objetivo" se excluyen acá — "ahorro" no, porque "caja de ahorro" es un nombre de
  // cuenta habitual en Argentina y la forma "de {cuenta} a {cuenta}" ya es lo bastante
  // específica como para no confundirse con un aporte a una meta (que nunca la usa).
  if (TRANSFER_VERB.test(normalized) && !/\b(meta|objetivo)\b/.test(normalized)) {
    const shape = TRANSFER_SHAPE.exec(normalized);
    if (shape) {
      const { amount } = parseAmount(raw.toLowerCase());
      const fromAccountName = cleanTail(shape[1]);
      const toAccountName = cleanTail(shape[2]);
      if (fromAccountName && toAccountName) return { kind: "CREATE_TRANSFER", amount, fromAccountName, toAccountName };
    }
  }

  // ── editar la categoría de un movimiento ─────────────────────────────────
  if (EDIT_CATEGORY_VERB.test(normalized) && /\bcategoria\b/.test(normalized)) {
    const shape = EDIT_CATEGORY_SHAPE.exec(normalized);
    if (shape) {
      const target = cleanTail(shape[1]);
      const categoryName = cleanTail(shape[2]);
      if (categoryName) {
        const isLast = !target || target === "ultimo" || target === "ultima";
        return isLast
          ? { kind: "EDIT_TRANSACTION_CATEGORY", mode: "last", categoryName }
          : { kind: "EDIT_TRANSACTION_CATEGORY", mode: "merchant", merchant: target, categoryName };
      }
    }
  }

  // ── mover plata a una meta ───────────────────────────────────────────────
  if (ALLOCATE_VERB.test(normalized) && /\b(meta|objetivo|ahorro)\b/.test(normalized)) {
    const { amount } = parseAmount(raw.toLowerCase());
    const nameMatch =
      /\b(?:a|para|hacia|en|al)\s+(?:la\s+|mi\s+|el\s+)?(?:meta|objetivo|ahorro)(?:\s+de|\s+del|\s+para)?\s+(.+)$/.exec(normalized) ??
      /\b(?:meta|objetivo|ahorro)(?:\s+de|\s+del)?\s+(.+)$/.exec(normalized);
    const goalName = nameMatch ? cleanTail(nameMatch[1]) : "";
    if (goalName || amount) return { kind: "ALLOCATE_TO_GOAL", amount, goalName };
  }

  // ── crear una meta nueva ──────────────────────────────────────────────────
  // Chequeado después de ALLOCATE_TO_GOAL: "sumá $X a mi meta" (aporte a una que ya existe)
  // gana sobre "creá una meta" — CREATE_GOAL_OR_BUDGET_VERB además excluye "sumá"/"pasá".
  if (CREATE_GOAL_OR_BUDGET_VERB.test(normalized) && NEW_GOAL_SHAPE.test(normalized)) {
    const { amount, currencyHint } = parseAmount(raw.toLowerCase());
    const nameMatch =
      /\bpara\s+(?:la\s+|mi\s+|el\s+)?(.+)$/.exec(normalized) ??
      /\b(?:meta|objetivo)\s+(?:de\s+|para\s+)?(.+)$/.exec(normalized);
    const normalizedName = nameMatch ? cleanTail(stripTrailingAmount(nameMatch[1])) : "";
    const name = normalizedName ? recoverCasing(normalizedName, raw) : "";
    if (name) return { kind: "CREATE_GOAL", name, amount, currencyHint };
  }

  // ── crear un presupuesto nuevo ────────────────────────────────────────────
  if (CREATE_GOAL_OR_BUDGET_VERB.test(normalized) && NEW_BUDGET_SHAPE.test(normalized)) {
    const { amount, currencyHint } = parseAmount(raw.toLowerCase());
    const nameMatch =
      /\bpara\s+(?:la\s+|mi\s+|el\s+)?(?:categoria\s+de\s+)?(.+)$/.exec(normalized) ??
      /\bpresupuesto\s+(?:de\s+|en\s+|para\s+)?(.+)$/.exec(normalized);
    const categoryName = nameMatch ? cleanTail(stripTrailingAmount(nameMatch[1])) : "";
    if (categoryName) return { kind: "CREATE_BUDGET", categoryName, amount, currencyHint };
  }

  // ── pagar la cuota de una obligación ─────────────────────────────────────
  if (PAY_OBLIGATION_VERB.test(normalized) && OBLIGATION_NOUN.test(normalized)) {
    const nameMatch =
      /\b(?:cuota|cuotas|tarjeta|prestamo|deuda|obligacion)(?:\s+de|\s+del)?\s+(?:la\s+|el\s+|mi\s+)?(.+)$/.exec(normalized) ??
      /\b(?:pagu[eé]\w*|pag[aá]\w*|abon[eé]\w*|abon[aá]\w*)\s+(?:la\s+|el\s+|mi\s+)?(.+)$/.exec(normalized);
    const obligationName = nameMatch ? cleanTail(nameMatch[1]) : "";
    return { kind: "PAY_OBLIGATION", obligationName };
  }

  // ── anular un movimiento ─────────────────────────────────────────────────
  if (VOID_VERB.test(normalized)) {
    if (/\bel? ?ultim[oa]\b/.test(normalized) || /\bmi ultim[oa]\b/.test(normalized)) {
      const ofType = /\bgasto\b/.test(normalized) ? "EXPENSE" : /\bingreso\b/.test(normalized) ? "INCOME" : null;
      return { kind: "VOID_LAST", ofType };
    }
    const m =
      /\b(?:el |la )?(?:gasto|movimiento|ingreso|compra|pago|cargo)\s+(?:de |en |a )?(.+)$/.exec(normalized) ??
      /\blo de\s+(.+)$/.exec(normalized);
    if (m) {
      const merchant = cleanTail(m[1]);
      if (merchant.length >= 2) return { kind: "VOID_MERCHANT", merchant };
    }
    if (/\bgasto\b/.test(normalized) || /\bmovimiento\b/.test(normalized)) {
      return { kind: "VOID_LAST", ofType: /\bgasto\b/.test(normalized) ? "EXPENSE" : null };
    }
  }

  return null;
}

function cleanTail(s: string): string {
  return s
    .replace(/[.,;:!?]+$/, "")
    .split(" ")
    .filter((w) => w && !FILLER.has(w) && /[a-z0-9]/i.test(w))
    .slice(0, 4)
    .join(" ")
    .trim();
}
