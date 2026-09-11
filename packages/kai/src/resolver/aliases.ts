import type { KaiIntentId } from "../domain/kai-intent";

/**
 * Alias phrasings (spec §15). Each entry is already normalised (lower-case, no accents,
 * no punctuation). A message that *contains* one of these phrases resolves to the intent
 * with high confidence — no LLM. Keep these short and unambiguous; put looser matches in
 * the keyword table instead.
 */
export const KAI_INTENT_ALIASES: Record<KaiIntentId, string[]> = {
  GET_MONTH_EXPENSES: [
    "cuanto gaste",
    "cuanto llevo gastado",
    "mis gastos",
    "gastos del mes",
    "cuanto gasto este mes",
    "total de gastos",
    "en que se me va la plata",
  ],
  GET_MONTH_INCOME: ["cuanto gane", "mis ingresos", "ingresos del mes", "cuanto cobre", "cuanto entro"],
  GET_MONTH_SAVINGS: [
    "cuanto ahorre",
    "cuanto estoy ahorrando",
    "mi ahorro",
    "tasa de ahorro",
    "cuanto pude ahorrar",
  ],
  GET_NET_CASHFLOW: ["como viene mi resultado", "resultado del mes", "flujo de caja", "balance del mes"],
  GET_SPENDING_PROJECTION: [
    "cuanto voy a gastar",
    "cuanto voy a terminar gastando",
    "a este ritmo cuanto gasto",
    "a este ritmo",
    "cuanto voy a gastar este mes",
    "me va a alcanzar",
    "voy a llegar a fin de mes",
    "proyecta mi gasto",
    "proyeccion de gasto",
    "como voy a cerrar el mes",
  ],
  GET_EXPENSE_COMPARISON: [
    "gaste mas que",
    "gaste menos que",
    "gaste mas o menos que",
    "compara mis gastos",
    "como vengo vs",
    "como voy vs",
    "estoy gastando mas",
    "estoy gastando menos",
    "gaste mas este mes",
    "gaste menos este mes",
  ],
  GET_CURRENT_BALANCE: [
    "cuanto tengo",
    "mi saldo",
    "cuanta plata tengo",
    "cuanto dinero tengo",
    "saldo total",
    "cuanta plata tengo en total",
  ],
  GET_ACCOUNT_BALANCES: ["saldo de mis cuentas", "cuanto tengo en cada cuenta", "saldos por cuenta"],
  GET_TOP_BALANCE_ACCOUNT: ["cuenta con mas saldo", "donde tengo mas plata", "mi cuenta mas grande"],
  GET_AVAILABLE_MONEY: [
    "cuanto tengo disponible",
    "tengo disponible",
    "que tengo disponible",
    "dinero disponible",
    "plata disponible",
    "cuanto puedo gastar",
    "cuanta plata puedo gastar",
    "que puedo gastar",
    "puedo gastar",
    "cuanto me queda para gastar",
    "me queda para gastar",
    "me queda algo para gastar",
    "para gastar",
    "cuanto me sobra",
    "cuanto me queda este mes",
    "sin quedar corto",
    "sin quedarme corto",
  ],
  // Category questions ("gasté en {cat}") are matched by the regex in intent-resolver.ts,
  // which guards against months / "total". No bare "en …" aliases here — too greedy.
  GET_CATEGORY_EXPENSES: [],
  GET_TOP_EXPENSE_CATEGORIES: [
    "en que gaste mas",
    "gastos por categoria",
    "gastos por rubro",
    "mis gastos por categoria",
    "grafico de gastos",
    "en que categorias gaste",
    "reparto de mis gastos",
    "mis mayores gastos por categoria",
    "categoria donde mas gasto",
    "en que se me va mas",
  ],
  GET_LARGEST_EXPENSE: ["mi mayor gasto", "el gasto mas grande", "cual fue mi mayor gasto", "gasto mas alto"],
  GET_YESTERDAY_EXPENSES: ["cuanto gaste ayer", "gastos de ayer"],
  GET_UPCOMING_PAYMENTS: [
    "que vence",
    "proximos pagos",
    "proximos movimientos",
    "proximas obligaciones",
    "mis obligaciones",
    "vencimientos",
    "que tengo que pagar",
    "que debo pagar",
    "pagos de esta semana",
    "que se vence",
    "que se viene",
    "que pagos tengo",
  ],
  GET_SUBSCRIPTIONS: ["mis suscripciones", "cuantas suscripciones tengo", "que suscripciones tengo"],
  GET_SUBSCRIPTION_COST: ["cuanto gasto en suscripciones", "cuanto pago de suscripciones", "costo de mis suscripciones"],
  // Matched by the "cuándo vence {x}" regex in intent-resolver.ts.
  GET_SUBSCRIPTION_NEXT: [],
  GET_BUDGET_STATUS: [
    "como viene mi presupuesto",
    "estado del presupuesto",
    "como van mis presupuestos",
    "me pase del presupuesto",
  ],
  GET_GOAL_PROGRESS: ["como viene mi meta", "progreso de mis metas", "como van mis metas", "cuanto me falta para la meta"],
  GET_INSIGHTS: ["algo que deba saber", "hay algo importante", "novedades", "que me recomendas"],
  // Write intents are resolved by parseWriteIntent (parse-write.ts) before the alias table,
  // so these lists stay empty — kept here only to satisfy the exhaustive Record type.
  CREATE_EXPENSE: [],
  CREATE_INCOME: [],
};

/**
 * Looser keyword / regex matches (spec §15 steps 5–6). Checked after aliases; matching
 * one gives a lower confidence than an alias hit but still stays deterministic.
 */
export const KAI_INTENT_KEYWORDS: { id: KaiIntentId; pattern: RegExp }[] = [
  { id: "GET_CATEGORY_EXPENSES", pattern: /\bgast\w+ en ([a-z ]{3,30})$/ },
  // "disponible" / "puedo gastar" / "para gastar" → lo que le queda para gastar,
  // no el saldo total. Chequeado antes del keyword genérico de "gasto".
  { id: "GET_AVAILABLE_MONEY", pattern: /\bdisponible\b|puedo gastar|para gastar|me sobra|quedar\w* corto/ },
  { id: "GET_MONTH_INCOME", pattern: /\bingres\w+\b|cuanto (gane|cobre|entro)/ },
  { id: "GET_CATEGORY_EXPENSES", pattern: /\bgast\w+ en (.{3,30})/ },
  { id: "GET_MONTH_EXPENSES", pattern: /\bgast\w+\b|en que se me va/ },
  { id: "GET_CURRENT_BALANCE", pattern: /\bsaldo\b|cuanta? (plata|dinero) tengo/ },
  { id: "GET_UPCOMING_PAYMENTS", pattern: /\bvenc\w+\b|\bpag\w+ pendiente|que (tengo que|debo) pagar/ },
  { id: "GET_SUBSCRIPTIONS", pattern: /\bsuscrip\w+\b/ },
  { id: "GET_BUDGET_STATUS", pattern: /\bpresupuest\w+\b/ },
  { id: "GET_GOAL_PROGRESS", pattern: /\bmeta\b|objetivo de ahorro/ },
];
