import { revalidatePath } from "next/cache";

/**
 * WP-EVENT-TAGS (spec 14 §19 "eventos de dominio e invalidación"). Every domain event this app
 * can emit, and — in `PATHS_BY_EVENT` below — the single, shared answer to "what must this
 * invalidate." Actions call `emitFinancialEvent()` instead of listing `revalidatePath` calls by
 * hand: the old per-action lists silently missed paths (voiding a transaction never revalidated
 * `/budgets`, so a voided expense kept counting against the month's budget on screen until some
 * other navigation happened to refresh it — see doc 08 finding A-2) and every route added by
 * WP-ROUTES-RENAME/WP-ROUTES-SUBVIEWS would otherwise require re-auditing every action file.
 *
 * This is path-based (`revalidatePath`), not tag-based, because that's what the app actually has:
 * pages read fresh from services/repos per request (no `unstable_cache`/`revalidateTag` layer
 * exists yet). Introducing per-user cache tags here would be unbuilt-on-top-of infrastructure —
 * if/when this app adopts `unstable_cache` for these reads, this is the one file that changes.
 */
export type FinancialEventType =
  | "account.created"
  | "account.archived"
  | "transaction.created"
  | "transaction.updated"
  | "transaction.voided"
  | "transfer.created"
  | "transfer.voided"
  | "obligation.created"
  | "obligation.updated"
  | "obligation.payment_linked"
  | "budget.updated"
  | "goal.updated"
  | "category.changed"
  | "personal_rule.changed"
  | "pending_item.resolved"
  | "import.completed"
  | "recurring.changed"
  | "subscription.changed"
  | "insight.updated";

const PATHS_BY_EVENT: Record<FinancialEventType, readonly string[]> = {
  "account.created": ["/accounts", "/app"],
  "account.archived": ["/accounts", "/app"],
  // CM-01/CM-02/CM-03 (§9): a transaction touches its own list, the account it moved money in/out
  // of, the budget it may consume, the dashboard, and the calendar (transactions can be linked
  // from scheduled/obligation entries shown there).
  "transaction.created": ["/transactions", "/accounts", "/budgets", "/app", "/calendar"],
  "transaction.updated": ["/transactions", "/accounts", "/budgets", "/app", "/calendar"],
  "transaction.voided": ["/transactions", "/accounts", "/budgets", "/app", "/calendar"],
  // CM-04 (§9): both accounts, never a budget (transfers are excluded from consumption).
  "transfer.created": ["/transactions", "/accounts", "/app", "/calendar"],
  "transfer.voided": ["/transactions", "/accounts", "/app", "/calendar"],
  // CM-05/CM-06 (§9, §14.1): an obligation and its payments affect the debt surface, the ledger
  // (a payment posts a transaction), the account it was paid from, and — because paying reduces
  // what's committed — budgets/app/calendar too.
  "obligation.created": ["/obligations", "/app", "/calendar"],
  "obligation.updated": ["/obligations", "/app", "/calendar"],
  "obligation.payment_linked": ["/obligations", "/transactions", "/accounts", "/budgets", "/app"],
  "budget.updated": ["/budgets", "/app"],
  "goal.updated": ["/goals", "/app"],
  // CM-09 (§9): a category change (create/rename/archive/mapping) can change what a transaction
  // or budget shows, plus the two "new" forms that list categories.
  "category.changed": ["/settings/categories", "/transactions/new", "/budgets/new", "/transactions", "/budgets"],
  // CM-10 (§9): a personal rule only affects future classification previews, not past ledger data.
  "personal_rule.changed": ["/settings/rules"],
  // CM-11 (§9): resolving a pending/duplicate item can post a transaction or dismiss it — cover
  // both review surfaces plus everything a newly-posted transaction would touch.
  "pending_item.resolved": ["/transactions/pending", "/transactions", "/accounts", "/budgets", "/app"],
  // CF-05: an import batch posts transactions and sends exceptions to Pendientes.
  "import.completed": ["/transactions", "/settings/imports", "/accounts", "/app"],
  "recurring.changed": ["/transactions/recurring"],
  "subscription.changed": ["/obligations/subscriptions"],
  // Dismiss/resolve/feedback on an insight only affects the Insights surface.
  "insight.updated": ["/insights"],
};

export type EmitFinancialEventInput = {
  type: FinancialEventType;
  /** Extra entity-specific paths this particular mutation also touches (e.g. `/accounts/:id`). */
  entityPaths?: readonly string[];
};

export function emitFinancialEvent(input: EmitFinancialEventInput, revalidate: (path: string) => void = revalidatePath) {
  const paths = new Set<string>([...PATHS_BY_EVENT[input.type], ...(input.entityPaths ?? [])]);
  // Cache invalidation is a non-essential side effect (gate G5): actions call this *after* the
  // financial write has already committed, so a revalidation failure must never turn a successful
  // write into an error response. Worst case, one surface shows slightly stale data until the next
  // navigation refreshes it — the same failure mode the old hand-rolled `revalidatePath` lists had
  // when they missed a path.
  for (const path of paths) {
    try {
      revalidate(path);
    } catch {
      // swallow — see above
    }
  }
}
