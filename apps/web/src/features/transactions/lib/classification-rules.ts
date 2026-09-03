// #15 / spec §82 — explicit user classification rules. Pure matcher, shared by
// transaction-service and any preview UI.

export type ClassificationRuleMatcher = "MERCHANT" | "DESCRIPTION";
export type ClassificationRuleMode = "CONTAINS" | "EQUALS" | "STARTS_WITH";

export type ClassificationRule = {
  id: string;
  matcher: ClassificationRuleMatcher;
  mode: ClassificationRuleMode;
  /** Already lower-cased / trimmed (as stored). */
  pattern: string;
  categoryId: string;
  priority: number;
};

/**
 * First active rule (rules are expected pre-sorted by priority) whose pattern matches the
 * merchant or description text. Returns null when nothing matches.
 */
export function matchClassificationRule(
  rules: ClassificationRule[],
  input: { merchant?: string | null; description?: string | null },
): ClassificationRule | null {
  const merchant = (input.merchant ?? "").trim().toLowerCase();
  const description = (input.description ?? "").trim().toLowerCase();

  for (const rule of rules) {
    const haystack = rule.matcher === "MERCHANT" ? merchant : description;
    const needle = rule.pattern.trim().toLowerCase();
    if (!haystack || !needle) continue;
    const hit =
      rule.mode === "EQUALS"
        ? haystack === needle
        : rule.mode === "STARTS_WITH"
          ? haystack.startsWith(needle)
          : haystack.includes(needle);
    if (hit) return rule;
  }
  return null;
}

const MATCHER_LABEL: Record<ClassificationRuleMatcher, string> = { MERCHANT: "el comercio", DESCRIPTION: "la descripción" };
const MODE_LABEL: Record<ClassificationRuleMode, string> = { CONTAINS: "contiene", EQUALS: "es", STARTS_WITH: "empieza con" };

/** Human phrasing of a rule, e.g. "el comercio contiene «ypf»". */
export function describeRule(rule: Pick<ClassificationRule, "matcher" | "mode" | "pattern">): string {
  return `${MATCHER_LABEL[rule.matcher]} ${MODE_LABEL[rule.mode]} «${rule.pattern}»`;
}
