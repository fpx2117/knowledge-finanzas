import {
  INTENT_CONFIDENCE_THRESHOLD,
  UNRESOLVED_INTENT,
  type KaiIntentId,
  type KaiResolvedIntent,
} from "../domain/kai-intent";
import { KAI_INTENT_ALIASES, KAI_INTENT_KEYWORDS } from "./aliases";
import { normalizeText } from "./normalize";
import { parseWriteIntent } from "./parse-write";

/**
 * Deterministic intent resolution (spec §15). Order of strategies, each cheaper and more
 * certain than the LLM:
 *   1. explicit quick-action id (a chip was tapped — never ambiguous)
 *   2. alias phrase contained in the message
 *   3. keyword / regex table
 *   4. give up → UNRESOLVED (the orchestrator may then use the LLM fallback)
 */
export function resolveIntent(rawMessage: string, quickActionIntentId?: string): KaiResolvedIntent {
  if (quickActionIntentId && isKaiIntentId(quickActionIntentId)) {
    return { id: quickActionIntentId, params: {}, confidence: 1, strategy: "quick-action" };
  }

  const normalized = normalizeText(rawMessage);
  if (!normalized) {
    return { id: UNRESOLVED_INTENT, params: {}, confidence: 0, strategy: "none" };
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

  // "¿cuánto gasté en {categoría}?" — checked first so the generic "cuanto gaste"
  // alias doesn't swallow the category question.
  const categoryMatch = /\bgast\w+ en ([a-záéíóúñ ]{3,30})$/.exec(normalized);
  if (categoryMatch) {
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
