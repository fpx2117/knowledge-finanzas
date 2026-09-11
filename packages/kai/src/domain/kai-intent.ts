/**
 * The deterministic intents KAI can answer without an LLM (spec §14 "Query Registry",
 * §1 LEVEL 1/2). Adding an intent = adding an id here, an entry in the intent registry,
 * an alias list, a handler and a template. Growing this catalogue is how
 * `KAI_LOCAL_RESOLUTION_RATE` goes up (spec §27).
 */
export type KaiIntentId =
  | "GET_MONTH_EXPENSES"
  | "GET_MONTH_INCOME"
  | "GET_MONTH_SAVINGS"
  | "GET_NET_CASHFLOW"
  | "GET_CURRENT_BALANCE"
  | "GET_ACCOUNT_BALANCES"
  | "GET_TOP_BALANCE_ACCOUNT"
  | "GET_AVAILABLE_MONEY"
  | "GET_CATEGORY_EXPENSES"
  | "GET_TOP_EXPENSE_CATEGORIES"
  | "GET_LARGEST_EXPENSE"
  | "GET_YESTERDAY_EXPENSES"
  | "GET_UPCOMING_PAYMENTS"
  | "GET_SUBSCRIPTIONS"
  | "GET_SUBSCRIPTION_COST"
  | "GET_BUDGET_STATUS"
  | "GET_GOAL_PROGRESS"
  | "GET_INSIGHTS"
  | "GET_EXPENSE_COMPARISON"
  | "CREATE_EXPENSE"
  | "CREATE_INCOME";

/** Sentinel returned by the resolver when nothing deterministic matched. */
export const UNRESOLVED_INTENT = "UNRESOLVED" as const;
export type UnresolvedIntent = typeof UNRESOLVED_INTENT;

/** How the resolver landed on an intent (spec §15 "Intent Resolver sin LLM"). */
export type KaiIntentMatchStrategy = "quick-action" | "alias" | "keyword" | "regex" | "none";

export type KaiResolvedIntent = {
  id: KaiIntentId | UnresolvedIntent;
  /** Extracted parameters — currently only `{ category }` for category questions. */
  params: Record<string, string>;
  /** 0..1. Below `INTENT_CONFIDENCE_THRESHOLD` we fall through to the LLM. */
  confidence: number;
  strategy: KaiIntentMatchStrategy;
};

/** Spec §17.1 — below this the LLM fallback is allowed to run. */
export const INTENT_CONFIDENCE_THRESHOLD = 0.6;
