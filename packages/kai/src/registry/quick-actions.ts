import type { KaiScreenContext } from "../domain/kai-context";
import type { KaiIntentId } from "../domain/kai-intent";

/**
 * Quick-action chips (spec §16). Tapping one runs the intent directly — no text
 * resolution, no LLM. The set shown depends on the screen the user is on (spec §10).
 */
export type KaiQuickAction = { label: string; intentId: KaiIntentId };

const COMMON: KaiQuickAction[] = [
  { label: "¿Cuánto gasté este mes?", intentId: "GET_MONTH_EXPENSES" },
  { label: "¿Cuánto tengo disponible?", intentId: "GET_AVAILABLE_MONEY" },
  { label: "¿Qué se me vence?", intentId: "GET_UPCOMING_PAYMENTS" },
];

export const KAI_QUICK_ACTIONS: Record<KaiScreenContext, KaiQuickAction[]> = {
  DASHBOARD: COMMON,
  ACCOUNTS: [
    { label: "¿Cuánto tengo en total?", intentId: "GET_CURRENT_BALANCE" },
    { label: "¿Qué cuenta tiene más saldo?", intentId: "GET_TOP_BALANCE_ACCOUNT" },
    { label: "¿Cuánto tengo disponible?", intentId: "GET_AVAILABLE_MONEY" },
  ],
  TRANSACTIONS: [
    { label: "¿Cuánto gasté este mes?", intentId: "GET_MONTH_EXPENSES" },
    { label: "¿Cuál fue mi mayor gasto?", intentId: "GET_LARGEST_EXPENSE" },
    { label: "¿En qué gasté más?", intentId: "GET_TOP_EXPENSE_CATEGORIES" },
  ],
  BUDGETS: [
    { label: "¿Cómo viene mi presupuesto?", intentId: "GET_BUDGET_STATUS" },
    { label: "¿En qué gasté más?", intentId: "GET_TOP_EXPENSE_CATEGORIES" },
    { label: "¿Cuánto gasté este mes?", intentId: "GET_MONTH_EXPENSES" },
  ],
  OBLIGATIONS: [
    { label: "¿Qué se me vence?", intentId: "GET_UPCOMING_PAYMENTS" },
    { label: "¿Cuántas suscripciones tengo?", intentId: "GET_SUBSCRIPTIONS" },
    { label: "¿Cuánto pago de suscripciones?", intentId: "GET_SUBSCRIPTION_COST" },
  ],
  CALENDAR: [
    { label: "¿Qué se me vence?", intentId: "GET_UPCOMING_PAYMENTS" },
    { label: "¿Cuánto gasté este mes?", intentId: "GET_MONTH_EXPENSES" },
    { label: "¿Cuánto tengo disponible?", intentId: "GET_AVAILABLE_MONEY" },
  ],
  GOALS: [
    { label: "¿Cómo viene mi meta?", intentId: "GET_GOAL_PROGRESS" },
    { label: "¿Cuánto ahorré este mes?", intentId: "GET_MONTH_SAVINGS" },
    { label: "¿Cuánto tengo disponible?", intentId: "GET_AVAILABLE_MONEY" },
  ],
  REPORTS: [
    { label: "¿En qué gasté más?", intentId: "GET_TOP_EXPENSE_CATEGORIES" },
    { label: "¿Cuál es mi resultado del mes?", intentId: "GET_NET_CASHFLOW" },
    { label: "¿Cuánto ahorré este mes?", intentId: "GET_MONTH_SAVINGS" },
  ],
  INSIGHTS: [
    { label: "¿Algo que deba saber?", intentId: "GET_INSIGHTS" },
    { label: "¿Cómo viene mi presupuesto?", intentId: "GET_BUDGET_STATUS" },
    { label: "¿Qué se me vence?", intentId: "GET_UPCOMING_PAYMENTS" },
  ],
  SETTINGS: COMMON,
  HELP: COMMON,
  UNKNOWN: COMMON,
};
