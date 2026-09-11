import {
  INTENT_CONFIDENCE_THRESHOLD,
  UNRESOLVED_INTENT,
  type KaiIntentId,
  type KaiResolvedIntent,
} from "../domain/kai-intent";
import { KAI_INTENT_ALIASES, KAI_INTENT_KEYWORDS } from "./aliases";
import { normalizeText } from "./normalize";
import { parseActionIntent, parseWriteIntent } from "./parse-write";

/**
 * Deterministic intent resolution (spec §15). Order of strategies, each cheaper and more
 * certain than the LLM:
 *   1. explicit quick-action id (a chip was tapped — never ambiguous)
 *   2. alias phrase contained in the message
 *   3. keyword / regex table
 *   4. give up → UNRESOLVED (the orchestrator may then use the LLM fallback)
 */
const TEMPORAL_TAIL =
  /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|total|este mes|el mes|esta semana|este ano|este trimestre|el ano|el trimestre|los ultimos)/;

const TEMPORAL_FOLLOWUP =
  /^(y|que tal|y que tal)\s+(ayer|hoy|esta semana|esta quincena|el mes pasado|este mes|este trimestre|el trimestre pasado|este ano|el ano pasado|en \w+|los ultimos)/;

export function resolveIntent(
  rawMessage: string,
  quickActionIntentId?: string,
  lastIntentId?: string,
): KaiResolvedIntent {
  if (quickActionIntentId && isKaiIntentId(quickActionIntentId)) {
    return { id: quickActionIntentId, params: {}, confidence: 1, strategy: "quick-action" };
  }

  const normalized = normalizeText(rawMessage);
  if (!normalized) {
    return { id: UNRESOLVED_INTENT, params: {}, confidence: 0, strategy: "none" };
  }

  // "¿y el mes pasado?" / "¿y ayer?" — re-run the previous intent with a new date range
  // (spec §15 follow-up context). The orchestrator resolves the range from this same message.
  if (lastIntentId && isKaiIntentId(lastIntentId) && TEMPORAL_FOLLOWUP.test(normalized)) {
    return { id: lastIntentId, params: {}, confidence: 0.9, strategy: "keyword" };
  }

  // Action intents (mover plata a una meta, anular un movimiento) — most specific, first.
  const action = parseActionIntent(normalized, rawMessage);
  if (action) {
    if (action.kind === "ALLOCATE_TO_GOAL") {
      return {
        id: "ALLOCATE_TO_GOAL",
        params: { goalName: action.goalName, ...(action.amount ? { amount: action.amount } : {}) },
        confidence: 0.95,
        strategy: "regex",
      };
    }
    if (action.kind === "PAY_OBLIGATION") {
      return {
        id: "PAY_OBLIGATION",
        params: { obligationName: action.obligationName },
        confidence: 0.95,
        strategy: "regex",
      };
    }
    if (action.kind === "CREATE_TRANSFER") {
      return {
        id: "CREATE_TRANSFER",
        params: {
          fromAccountName: action.fromAccountName,
          toAccountName: action.toAccountName,
          ...(action.amount ? { amount: action.amount } : {}),
        },
        confidence: 0.95,
        strategy: "regex",
      };
    }
    if (action.kind === "EDIT_TRANSACTION_CATEGORY") {
      return {
        id: "EDIT_TRANSACTION_CATEGORY",
        params: { mode: action.mode, categoryName: action.categoryName, ...(action.merchant ? { merchant: action.merchant } : {}) },
        confidence: 0.95,
        strategy: "regex",
      };
    }
    if (action.kind === "CREATE_GOAL") {
      return {
        id: "CREATE_GOAL",
        params: { name: action.name, ...(action.amount ? { amount: action.amount } : {}), ...(action.currencyHint ? { currencyHint: action.currencyHint } : {}) },
        confidence: 0.95,
        strategy: "regex",
      };
    }
    if (action.kind === "CREATE_BUDGET") {
      return {
        id: "CREATE_BUDGET",
        params: {
          categoryName: action.categoryName,
          ...(action.amount ? { amount: action.amount } : {}),
          ...(action.currencyHint ? { currencyHint: action.currencyHint } : {}),
        },
        confidence: 0.95,
        strategy: "regex",
      };
    }
    return {
      id: "VOID_TRANSACTION",
      params:
        action.kind === "VOID_MERCHANT"
          ? { mode: "merchant", merchant: action.merchant }
          : { mode: "last", ...(action.ofType ? { ofType: action.ofType } : {}) },
      confidence: 0.9,
      strategy: "regex",
    };
  }

  // Write intents ("creá un gasto de YPF de $30.000") — checked before any read intent so a
  // command is never mistaken for a question (spec §11).
  const write = parseWriteIntent(normalized, rawMessage);
  if (write) {
    return {
      id: write.kind,
      params: {
        description: write.description,
        ...(write.amount ? { amount: write.amount } : {}),
        ...(write.merchant ? { merchant: write.merchant } : {}),
        ...(write.currencyHint ? { currencyHint: write.currencyHint } : {}),
      },
      confidence: 0.95,
      strategy: "regex",
    };
  }

  // "¿cuándo vence Netflix?" / "¿cuándo se renueva mi {x}?"
  const subMatch = /\b(cuando|que dia)\s+(vence|se renueva|renueva|se debita|debita|pago|cobran)\s+(mi\s+|la\s+|el\s+)?(.{2,30})$/.exec(normalized);
  if (subMatch) {
    return { id: "GET_SUBSCRIPTION_NEXT", params: { subscription: subMatch[4].trim() }, confidence: 0.9, strategy: "regex" };
  }

  // "¿cuánto gasté en {categoría}?" — checked first so the generic "cuanto gaste"
  // alias doesn't swallow the category question. "en junio" / "en total" / "esta semana"
  // are temporal or degenerate, not categories.
  const categoryMatch = /\bgast\w+ en ([a-záéíóúñ ]{3,30})$/.exec(normalized);
  if (categoryMatch && !TEMPORAL_TAIL.test(categoryMatch[1].trim())) {
    return { id: "GET_CATEGORY_EXPENSES", params: { category: categoryMatch[1].trim() }, confidence: 0.9, strategy: "regex" };
  }

  // Longest contained alias wins: "cuanto tengo disponible" (GET_AVAILABLE_MONEY) beats the
  // shorter "cuanto tengo" (GET_CURRENT_BALANCE) even though the latter is a substring.
  const aliasHit = ALIAS_INDEX.find((entry) => normalized.includes(entry.phrase));
  if (aliasHit) {
    return {
      id: aliasHit.id,
      params: extractParams(aliasHit.id, normalized),
      confidence: aliasHit.phrase.length >= 12 ? 0.95 : 0.8,
      strategy: "alias",
    };
  }

  for (const { id, pattern } of KAI_INTENT_KEYWORDS) {
    const match = pattern.exec(normalized);
    if (match) {
      const params = match[1] ? { category: match[1].trim() } : extractParams(id, normalized);
      return { id, params, confidence: 0.65, strategy: match[1] ? "regex" : "keyword" };
    }
  }

  // WP-KAI-RESOLVER-FUZZY (spec §15): a typo shouldn't have to fall through to the LLM.
  // Last resort before giving up — deliberately conservative (see fuzzyAliasMatch) so it can't
  // start swallowing phrasings the exact/keyword steps above were supposed to catch on their own.
  const fuzzy = fuzzyAliasMatch(normalized);
  if (fuzzy) {
    return { id: fuzzy.id, params: extractParams(fuzzy.id, normalized), confidence: 0.75, strategy: "fuzzy" };
  }

  return { id: UNRESOLVED_INTENT, params: {}, confidence: 0, strategy: "none" };
}

/** True when the resolved intent should be answered deterministically (no LLM). */
export function isConfident(resolved: KaiResolvedIntent): resolved is KaiResolvedIntent & { id: KaiIntentId } {
  return resolved.id !== UNRESOLVED_INTENT && resolved.confidence >= INTENT_CONFIDENCE_THRESHOLD;
}

function extractParams(intentId: KaiIntentId, normalized: string): Record<string, string> {
  if (intentId === "GET_CATEGORY_EXPENSES") {
    const m = /\ben ([a-z ]{3,30})$/.exec(normalized);
    if (m) return { category: m[1].trim() };
  }
  return {};
}

/** All (intent, alias phrase) pairs, longest phrase first — see the alias match above. */
const ALIAS_INDEX: { id: KaiIntentId; phrase: string }[] = (
  Object.entries(KAI_INTENT_ALIASES) as [KaiIntentId, string[]][]
)
  .flatMap(([id, phrases]) => phrases.map((phrase) => ({ id, phrase })))
  .sort((a, b) => b.phrase.length - a.phrase.length);

const KAI_INTENT_IDS = new Set(Object.keys(KAI_INTENT_ALIASES));

function isKaiIntentId(value: string): value is KaiIntentId {
  return KAI_INTENT_IDS.has(value);
}

/** Classic edit distance — cheap here, both strings are single words. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** A word matches its alias counterpart if identical, or — only once it's long enough that a
 * single typo can't flip it into an unrelated word ("de"→"se" is a 1-edit "typo" no one made) —
 * within edit distance 1. Short words (≤4 chars: "de", "en", "mis", "vale"…) must match exactly. */
function wordFuzzyMatches(messageWord: string, aliasWord: string): boolean {
  if (messageWord === aliasWord) return true;
  if (aliasWord.length <= 4) return false;
  return levenshtein(messageWord, aliasWord) <= 1;
}

/**
 * A conservative typo-tolerant alias match, tried only after exact aliases and keyword regexes
 * both missed (spec §15 step 7). Requires every word of the alias phrase to line up, in order,
 * against a contiguous run of the message's words — same shape as the exact alias check, just
 * with a 1-edit tolerance per word — so it can't match on a handful of scattered word fragments.
 */
function fuzzyAliasMatch(normalized: string): { id: KaiIntentId; phrase: string } | null {
  const messageWords = normalized.split(" ").filter(Boolean);
  for (const entry of ALIAS_INDEX) {
    const phraseWords = entry.phrase.split(" ").filter(Boolean);
    if (phraseWords.length === 0 || phraseWords.length > messageWords.length) continue;
    for (let start = 0; start <= messageWords.length - phraseWords.length; start += 1) {
      const allMatch = phraseWords.every((word, offset) => wordFuzzyMatches(messageWords[start + offset], word));
      if (allMatch) return entry;
    }
  }
  return null;
}
