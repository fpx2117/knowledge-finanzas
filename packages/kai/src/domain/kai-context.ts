/**
 * Screen context (spec §10). KAI knows which screen the user is on so "¿qué es esto?"
 * and the quick-action chips can be answered locally, without an LLM. The registry maps
 * a route prefix to a context id; `resolveScreenContext` picks the longest matching
 * prefix.
 */
export type KaiScreenContext =
  | "DASHBOARD"
  | "ACCOUNTS"
  | "TRANSACTIONS"
  | "BUDGETS"
  | "OBLIGATIONS"
  | "CALENDAR"
  | "GOALS"
  | "REPORTS"
  | "INSIGHTS"
  | "SETTINGS"
  | "HELP"
  | "UNKNOWN";

/** Route prefix → context. Order does not matter; longest prefix wins in the resolver. */
export const KAI_CONTEXT_REGISTRY: Record<string, KaiScreenContext> = {
  "/app": "DASHBOARD",
  "/accounts": "ACCOUNTS",
  "/transactions": "TRANSACTIONS",
  "/budgets": "BUDGETS",
  "/obligations": "OBLIGATIONS",
  "/upcoming": "OBLIGATIONS",
  "/installments": "OBLIGATIONS",
  "/subscriptions": "OBLIGATIONS",
  "/calendar": "CALENDAR",
  "/goals": "GOALS",
  "/reports": "REPORTS",
  "/expenses": "REPORTS",
  "/income": "REPORTS",
  "/cash-flow": "REPORTS",
  "/net-worth": "REPORTS",
  "/categories": "REPORTS",
  "/insights": "INSIGHTS",
  "/settings": "SETTINGS",
  "/help": "HELP",
};

export function resolveScreenContext(pathname: string | null | undefined): KaiScreenContext {
  if (!pathname) return "UNKNOWN";
  let best: { prefix: string; context: KaiScreenContext } | null = null;
  for (const [prefix, context] of Object.entries(KAI_CONTEXT_REGISTRY)) {
    if ((pathname === prefix || pathname.startsWith(`${prefix}/`)) && (!best || prefix.length > best.prefix.length)) {
      best = { prefix, context };
    }
  }
  return best?.context ?? "UNKNOWN";
}
