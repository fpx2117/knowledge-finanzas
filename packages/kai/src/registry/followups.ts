import type { KaiIntentId } from "../domain/kai-intent";

/**
 * A follow-up chip KAI offers after an answer (spec §16 — reduce free-text with buttons).
 * `intentId` re-runs a known intent; `message` sends a phrase (used when the date range or
 * wording matters, e.g. "el mes pasado").
 */
export type KaiFollowup = { label: string; intentId?: KaiIntentId; message?: string };

const q = (label: string, intentId: KaiIntentId): KaiFollowup => ({ label, intentId });
const m = (label: string, message: string): KaiFollowup => ({ label, message });

const DEFAULT: KaiFollowup[] = [
  q("¿Cuánto gasté este mes?", "GET_MONTH_EXPENSES"),
  q("¿Qué se me vence?", "GET_UPCOMING_PAYMENTS"),
  q("¿Cuánto tengo disponible?", "GET_AVAILABLE_MONEY"),
];

const BY_INTENT: Partial<Record<KaiIntentId, KaiFollowup[]>> = {
  GET_MONTH_EXPENSES: [
    q("¿En qué gasté más?", "GET_TOP_EXPENSE_CATEGORIES"),
    m("¿Y el mes pasado?", "cuánto gasté el mes pasado"),
    q("¿Cómo viene mi presupuesto?", "GET_BUDGET_STATUS"),
  ],
  GET_MONTH_INCOME: [
    q("¿Cuánto ahorré este mes?", "GET_MONTH_SAVINGS"),
    q("¿Cuál es mi resultado del mes?", "GET_NET_CASHFLOW"),
  ],
  GET_MONTH_SAVINGS: [
    q("¿Cómo viene mi meta?", "GET_GOAL_PROGRESS"),
    q("¿En qué gasté más?", "GET_TOP_EXPENSE_CATEGORIES"),
  ],
  GET_NET_CASHFLOW: [
    q("¿En qué gasté más?", "GET_TOP_EXPENSE_CATEGORIES"),
    q("¿Cuánto tengo disponible?", "GET_AVAILABLE_MONEY"),
  ],
  GET_CURRENT_BALANCE: [
    q("¿Cuánto tengo disponible?", "GET_AVAILABLE_MONEY"),
    q("¿Qué cuenta tiene más saldo?", "GET_TOP_BALANCE_ACCOUNT"),
  ],
  GET_ACCOUNT_BALANCES: [
    q("¿Cuánto tengo disponible?", "GET_AVAILABLE_MONEY"),
    q("¿Qué cuenta tiene más saldo?", "GET_TOP_BALANCE_ACCOUNT"),
  ],
  GET_TOP_BALANCE_ACCOUNT: [
    q("¿Cuánto tengo en total?", "GET_CURRENT_BALANCE"),
    q("¿Cuánto tengo disponible?", "GET_AVAILABLE_MONEY"),
  ],
  GET_AVAILABLE_MONEY: [
    q("¿Qué se me vence?", "GET_UPCOMING_PAYMENTS"),
    q("¿Cómo viene mi presupuesto?", "GET_BUDGET_STATUS"),
  ],
  GET_CATEGORY_EXPENSES: [
    q("¿En qué gasté más?", "GET_TOP_EXPENSE_CATEGORIES"),
    q("¿Cómo viene mi presupuesto?", "GET_BUDGET_STATUS"),
  ],
  GET_TOP_EXPENSE_CATEGORIES: [
    q("¿Cómo viene mi presupuesto?", "GET_BUDGET_STATUS"),
    q("¿Cuál fue mi mayor gasto?", "GET_LARGEST_EXPENSE"),
    m("¿Y el mes pasado?", "en qué gasté más el mes pasado"),
  ],
  GET_LARGEST_EXPENSE: [
    q("¿En qué gasté más?", "GET_TOP_EXPENSE_CATEGORIES"),
    q("¿Cuánto gasté este mes?", "GET_MONTH_EXPENSES"),
  ],
  GET_YESTERDAY_EXPENSES: [
    q("¿Cuánto gasté este mes?", "GET_MONTH_EXPENSES"),
    q("¿En qué gasté más?", "GET_TOP_EXPENSE_CATEGORIES"),
  ],
  GET_UPCOMING_PAYMENTS: [
    q("¿Cuántas suscripciones tengo?", "GET_SUBSCRIPTIONS"),
    q("¿Cuánto tengo disponible?", "GET_AVAILABLE_MONEY"),
  ],
  GET_SUBSCRIPTIONS: [
    q("¿Cuánto pago de suscripciones?", "GET_SUBSCRIPTION_COST"),
    q("¿Qué se me vence?", "GET_UPCOMING_PAYMENTS"),
  ],
  GET_SUBSCRIPTION_COST: [
    q("¿Cuáles son mis suscripciones?", "GET_SUBSCRIPTIONS"),
    q("¿Qué se me vence?", "GET_UPCOMING_PAYMENTS"),
  ],
  GET_BUDGET_STATUS: [
    q("¿En qué gasté más?", "GET_TOP_EXPENSE_CATEGORIES"),
    q("¿Cuánto gasté este mes?", "GET_MONTH_EXPENSES"),
  ],
  GET_GOAL_PROGRESS: [
    q("¿Cuánto ahorré este mes?", "GET_MONTH_SAVINGS"),
    q("¿Cuánto tengo disponible?", "GET_AVAILABLE_MONEY"),
  ],
  GET_INSIGHTS: [
    q("¿Cómo viene mi presupuesto?", "GET_BUDGET_STATUS"),
    q("¿Qué se me vence?", "GET_UPCOMING_PAYMENTS"),
  ],
  CREATE_EXPENSE: [
    q("¿Cuánto gasté este mes?", "GET_MONTH_EXPENSES"),
    q("¿Cuánto tengo disponible?", "GET_AVAILABLE_MONEY"),
  ],
  CREATE_INCOME: [
    q("¿Cuál es mi resultado del mes?", "GET_NET_CASHFLOW"),
    q("¿Cuánto ahorré este mes?", "GET_MONTH_SAVINGS"),
  ],
};

/** Follow-ups for whatever KAI just answered. `intentId` is the audit id (may be STATIC/UNRESOLVED). */
export function resolveFollowups(intentId: string): KaiFollowup[] {
  return BY_INTENT[intentId as KaiIntentId] ?? DEFAULT;
}
