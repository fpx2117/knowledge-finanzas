// #14 / spec §41 — "¿Por qué?". Turns the provenance recorded on `transactions.classification`
// (by transaction-service) into a concise, plain-language explanation. Pure — safe on server
// and client.

import { describeRule } from "./classification-rules";

export type ClassificationRecord = {
  method?: "user_explicit" | "user_rule" | "merchant_default" | "suggested" | "none";
  categoryConfidence?: number;
  merchantConfidence?: number;
  reviewedByUser?: boolean;
  merchantName?: string | null;
  merchantMatch?: "selected" | "exact" | "prefix" | "contains" | "regex" | null;
  categorySource?: "user" | "personal_default" | "merchant_default" | null;
  priorSimilarCount?: number | null;
  automationLevel?: "ask" | "auto_undo" | "silent" | null;
  suggestion?: { categoryId: string | null; taxonomyNodeId: string | null } | null;
  ruleId?: string;
  ruleMatcher?: "MERCHANT" | "DESCRIPTION";
  ruleMode?: "CONTAINS" | "EQUALS" | "STARTS_WITH";
  rulePattern?: string;
};

export type ClassificationExplanation = { headline: string; reasons: string[] };

/**
 * Returns null when there is nothing to explain (no classification, or a category the user
 * set manually with no automation involved was still explained as such — see below).
 */
export function explainClassification(
  raw: unknown,
  ctx: { categoryName?: string | null } = {},
): ClassificationExplanation | null {
  const c = (raw && typeof raw === "object" ? raw : {}) as ClassificationRecord;
  const cat = ctx.categoryName?.trim() || "esta categoría";

  if (c.method === "user_explicit") {
    return { headline: "La elegiste vos.", reasons: ["Categorizaste este movimiento manualmente."] };
  }
  if (c.method === "user_rule") {
    const rulePart =
      c.ruleMatcher && c.ruleMode && c.rulePattern
        ? describeRule({ matcher: c.ruleMatcher, mode: c.ruleMode, pattern: c.rulePattern })
        : null;
    return {
      headline: `La pusimos en ${cat} por una regla tuya.`,
      reasons: rulePart
        ? [`Tenés una regla: si ${rulePart} → ${cat}.`, "Las reglas se aplican siempre, antes que cualquier sugerencia automática."]
        : ["Coincide con una regla de clasificación que definiste."],
    };
  }
  if (c.method !== "merchant_default" && c.method !== "suggested") return null;

  const merchant = c.merchantName?.trim() || null;
  const reasons: string[] = [];

  if (merchant) {
    reasons.push(
      c.merchantMatch === "selected"
        ? `Elegiste el comercio ${merchant} de la lista.`
        : c.merchantMatch === "exact"
          ? `Reconocimos el comercio ${merchant} por una coincidencia exacta.`
          : `Tu texto coincide con el comercio ${merchant}.`,
    );
  }

  if (c.categorySource === "personal_default") {
    reasons.push(`Vos definiste que ${merchant ?? "este comercio"} es ${cat} para tu cuenta.`);
  } else if (c.categorySource === "merchant_default") {
    reasons.push(`${merchant ?? "Este comercio"} suele registrarse como ${cat}.`);
  }

  if (typeof c.priorSimilarCount === "number" && c.priorSimilarCount > 0) {
    reasons.push(
      c.priorSimilarCount === 1
        ? `Ya tuviste 1 movimiento con este comercio en ${cat}.`
        : `Tus últimos ${c.priorSimilarCount} movimientos con este comercio fueron ${cat}.`,
    );
  }

  let headline: string;
  if (c.method === "suggested" || c.automationLevel === "ask") {
    headline = `Sugerencia: ${cat}. Todavía no la aplicamos sola — confirmala vos.`;
  } else if (c.automationLevel === "silent") {
    headline = `La pusimos en ${cat} automáticamente.`;
    reasons.push("Como ya lo confirmaste varias veces, la aplicamos sin preguntar.");
  } else {
    headline = `La pusimos en ${cat} automáticamente. Podés cambiarla.`;
  }

  return { headline, reasons };
}
