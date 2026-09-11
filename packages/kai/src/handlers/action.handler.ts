import { formatDayMonth, formatMoney } from "../templates/format";
import { normalizeText } from "../resolver/normalize";
import type { KaiHandler } from "./types";

/**
 * "Aportá $10.000 a la meta Viaje" (spec §11). Resolves the goal name, shows a confirmation.
 * The write happens in apps/web only after the user taps "Confirmar".
 */
export const allocateToGoal: KaiHandler = async ({ ports, params, baseCurrency }) => {
  const goals = await ports.getGoalsForAllocation();
  if (goals.length === 0) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: "Todavía no tenés metas de ahorro.",
        actions: [{ kind: "navigate", label: "Crear una meta", route: "/goals" }],
      },
    };
  }

  const q = normalizeText(params.goalName ?? "");
  const match = q
    ? goals.find((g) => normalizeText(g.name).includes(q) || q.includes(normalizeText(g.name)))
    : goals.length === 1
      ? goals[0]
      : undefined;

  if (!match) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: `¿A qué meta querés aportar? Tenés: ${goals.map((g) => g.name).join(", ")}.`,
        actions: [{ kind: "navigate", label: "Ver metas", route: "/goals" }],
      },
    };
  }

  const amount = params.amount;
  if (!amount) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_ACTION",
        state: "NEUTRAL",
        title: "Aportar a una meta",
        body: `¿Cuánto querés aportar a ${match.name}?`,
        actions: [{ kind: "navigate", label: `Abrir ${match.name}`, route: "/goals" }],
      },
    };
  }

  const confirmParams = { goalId: match.id, goalName: match.name, amount, currencyCode: match.currencyCode };
  return {
    source: "TEMPLATE",
    response: {
      type: "KAI_CONFIRMATION",
      state: "NEUTRAL",
      title: "Aportar a una meta",
      body: `¿Aporto ${formatMoney(amount, match.currencyCode)} a tu meta ${match.name}?`,
      data: { pendingAllocation: confirmParams },
      actions: [
        { kind: "confirm-goal-allocation", label: "Confirmar", params: confirmParams },
        { kind: "navigate", label: "Abrir la meta", route: "/goals" },
      ],
    },
  };
};

/**
 * "Pagué la cuota del auto" / "abonar la tarjeta Visa" (spec §11). Resolves which debt/
 * obligation, shows the earliest unpaid installment amount for confirmation — KAI never asks
 * the user to type the amount, it's already known. The write (and picking which account it
 * comes out of) happens in apps/web only after "Confirmar".
 */
export const payObligation: KaiHandler = async ({ ports, params }) => {
  const obligations = await ports.getObligationsForPayment();
  if (obligations.length === 0) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: "No tenés deudas u obligaciones activas para pagar.",
        actions: [{ kind: "navigate", label: "Ver obligaciones", route: "/obligations" }],
      },
    };
  }

  const q = normalizeText(params.obligationName ?? "");
  const match = q
    ? obligations.find((o) => normalizeText(o.name).includes(q) || q.includes(normalizeText(o.name)))
    : obligations.length === 1
      ? obligations[0]
      : undefined;

  if (!match) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: `¿Cuál de estas querés pagar? Tenés: ${obligations.map((o) => o.name).join(", ")}.`,
        actions: [{ kind: "navigate", label: "Ver obligaciones", route: "/obligations" }],
      },
    };
  }

  if (!match.nextInstallmentAmount) {
    return {
      source: "DATABASE",
      response: {
        type: "KAI_TEXT",
        state: "POSITIVE",
        body: `${match.name} ya está totalmente pagada.`,
        actions: [{ kind: "navigate", label: "Ver obligaciones", route: "/obligations" }],
      },
    };
  }

  const confirmParams = { debtId: match.id, debtName: match.name, amount: match.nextInstallmentAmount, currencyCode: match.currencyCode };
  return {
    source: "DATABASE",
    response: {
      type: "KAI_CONFIRMATION",
      state: "NEUTRAL",
      title: "Pagar una cuota",
      body: `¿Pago ${formatMoney(match.nextInstallmentAmount, match.currencyCode)} de ${match.name}${
        match.nextDueOn ? ` (vence el ${formatDayMonth(match.nextDueOn)})` : ""
      }?`,
      data: { pendingPayment: confirmParams },
      actions: [
        { kind: "confirm-pay-obligation", label: "Confirmar pago", params: confirmParams },
        { kind: "navigate", label: "Ver la obligación", route: "/obligations" },
      ],
    },
  };
};

/**
 * "Transferí $10.000 de mi banco a mi billetera" (spec §11). Resolves both accounts by name,
 * shows a confirmation. Currency-mismatch is left to the write action's own validation — the
 * card only claims what it can already tell (the amount, in the source account's currency).
 */
export const createTransfer: KaiHandler = async ({ ports, params }) => {
  const accounts = await ports.getAccountsForTransfer();
  if (accounts.length < 2) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: "Necesitás al menos dos cuentas para transferir entre ellas.",
        actions: [{ kind: "navigate", label: "Ver cuentas", route: "/accounts" }],
      },
    };
  }

  const matchAccount = (nameQuery: string | undefined) => {
    const q = normalizeText(nameQuery ?? "");
    return q ? accounts.find((a) => normalizeText(a.name).includes(q) || q.includes(normalizeText(a.name))) : undefined;
  };
  const from = matchAccount(params.fromAccountName);
  const to = matchAccount(params.toAccountName);

  if (!from || !to) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: `No identifiqué ${!from ? `la cuenta de origen ("${params.fromAccountName ?? ""}")` : `la cuenta de destino ("${params.toAccountName ?? ""}")`}. Tenés: ${accounts.map((a) => a.name).join(", ")}.`,
        actions: [{ kind: "navigate", label: "Ver cuentas", route: "/accounts" }],
      },
    };
  }

  if (from.id === to.id) {
    return {
      source: "TEMPLATE",
      response: { type: "KAI_TEXT", state: "NEUTRAL", body: "El origen y el destino no pueden ser la misma cuenta." },
    };
  }

  const amount = params.amount;
  if (!amount) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_ACTION",
        state: "NEUTRAL",
        title: "Transferir entre cuentas",
        body: `¿Cuánto querés transferir de ${from.name} a ${to.name}?`,
        actions: [{ kind: "navigate", label: "Abrir transferencia", route: "/transactions/transfers/new" }],
      },
    };
  }

  const confirmParams = { fromAccountId: from.id, toAccountId: to.id, amount, currencyCode: from.currencyCode };
  return {
    source: "TEMPLATE",
    response: {
      type: "KAI_CONFIRMATION",
      state: "NEUTRAL",
      title: "Transferir entre cuentas",
      body: `¿Transfiero ${formatMoney(amount, from.currencyCode)} de ${from.name} a ${to.name}?`,
      data: { pendingTransfer: confirmParams },
      actions: [
        { kind: "confirm-transfer", label: "Confirmar", params: confirmParams },
        { kind: "navigate", label: "Ver cuentas", route: "/accounts" },
      ],
    },
  };
};

/**
 * "Cambiá la categoría del gasto de YPF a Transporte" (spec §11). The only movement edit the
 * app actually supports is metadata (category/comercio/nota) — never the amount, which is
 * corrected by voiding and recreating so the ledger stays consistent (spec 14 §9). Finds the
 * movement, resolves the target category by name among the user's own categories of that
 * same type, and shows a confirmation with exactly what changes.
 */
export const editTransactionCategory: KaiHandler = async ({ ports, params }) => {
  const mode = params.mode === "merchant" ? "merchant" : "last";
  const tx = await ports.findTransactionToVoid({ mode, ...(params.merchant ? { merchant: params.merchant } : {}) });
  if (!tx) {
    return {
      source: "DATABASE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body:
          mode === "merchant"
            ? `No encontré un movimiento reciente que coincida con "${params.merchant ?? ""}".`
            : "No encontré un movimiento reciente para editar.",
        actions: [{ kind: "navigate", label: "Ver movimientos", route: "/transactions" }],
      },
    };
  }

  const categories = await ports.getCategoriesForEdit(tx.type);
  const q = normalizeText(params.categoryName ?? "");
  const category = categories.find((c) => normalizeText(c.name).includes(q) || q.includes(normalizeText(c.name)));

  if (!category) {
    return {
      source: "DATABASE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: `No encontré la categoría "${params.categoryName ?? ""}". Tenés: ${categories.map((c) => c.name).join(", ")}.`,
        actions: [{ kind: "navigate", label: "Ver categorías", route: "/settings/categories" }],
      },
    };
  }

  const who = tx.merchant ?? tx.description;
  const confirmParams = { transactionId: tx.id, categoryId: category.id, categoryName: category.name, description: tx.description };
  return {
    source: "DATABASE",
    response: {
      type: "KAI_CONFIRMATION",
      state: "NEUTRAL",
      title: "Cambiar categoría",
      body: `¿Cambio a ${category.name} la categoría del ${tx.type === "INCOME" ? "ingreso" : "gasto"} de ${formatMoney(tx.amount, tx.currencyCode)}${who ? ` en ${who}` : ""}?`,
      data: { pendingEdit: confirmParams },
      actions: [
        { kind: "confirm-edit-category", label: "Confirmar", params: confirmParams },
        { kind: "navigate", label: "Ver el movimiento", route: "/transactions" },
      ],
    },
  };
};

const GOAL_CATEGORY_KEYWORDS: { pattern: RegExp; category: string }[] = [
  { pattern: /\b(viaje|vacacion\w*|luna de miel)\b/, category: "TRAVEL" },
  { pattern: /\b(auto|moto|vehiculo|0km|coche)\b/, category: "VEHICLE" },
  { pattern: /\b(casa|depto|departamento|hogar|vivienda)\b/, category: "HOME" },
  { pattern: /\b(estudio\w*|curso|carrera|universidad|educacion)\b/, category: "EDUCATION" },
  { pattern: /\b(emergencia\w*|fondo)\b/, category: "EMERGENCY_FUND" },
  { pattern: /\b(inversion\w*|invertir)\b/, category: "INVESTMENT" },
];

/** Infers the goal category enum from the free-text name — KAI never asks for it. */
function inferGoalCategory(name: string): string {
  const q = normalizeText(name);
  return GOAL_CATEGORY_KEYWORDS.find((k) => k.pattern.test(q))?.category ?? "OTHER";
}

/**
 * "Creá una meta de $500.000 para Viaje" (spec §11). Name and target amount come straight
 * from the message; the goal category is inferred from the name (KAI never asks for it) and
 * the currency defaults to the user's base currency unless the message named USD.
 */
export const createGoal: KaiHandler = async ({ params, baseCurrency }) => {
  const name = params.name;
  if (!name) {
    return { source: "TEMPLATE", response: { type: "KAI_TEXT", state: "NEUTRAL", body: "¿Cómo se llama la meta que querés crear?" } };
  }
  const amount = params.amount;
  if (!amount) {
    return {
      source: "TEMPLATE",
      response: {
        type: "KAI_ACTION",
        state: "NEUTRAL",
        title: "Crear una meta",
        body: `¿Cuál es el monto objetivo de "${name}"?`,
        actions: [{ kind: "navigate", label: "Crear desde el formulario", route: "/goals/new" }],
      },
    };
  }

  const currencyCode = params.currencyHint === "USD" ? "USD" : baseCurrency;
  const category = inferGoalCategory(name);
  const confirmParams = { name, targetAmount: amount, category, currencyCode };
  return {
    source: "TEMPLATE",
    response: {
      type: "KAI_CONFIRMATION",
      state: "NEUTRAL",
      title: "Crear una meta",
      body: `¿Creo la meta "${name}" con un objetivo de ${formatMoney(amount, currencyCode)}?`,
      data: { pendingGoal: confirmParams },
      actions: [
        { kind: "confirm-create-goal", label: "Crear meta", params: confirmParams },
        { kind: "navigate", label: "Ver metas", route: "/goals" },
      ],
    },
  };
};

/**
 * "Creá un presupuesto de $200.000 para Comida" (spec §11). Resolves the category by name
 * among the user's own expense categories; the currency defaults to the base currency.
 */
export const createBudget: KaiHandler = async ({ ports, params, baseCurrency }) => {
  const categories = await ports.getCategoriesForEdit("EXPENSE");
  const q = normalizeText(params.categoryName ?? "");
  const category = q ? categories.find((c) => normalizeText(c.name).includes(q) || q.includes(normalizeText(c.name))) : undefined;

  if (!category) {
    return {
      source: "DATABASE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: `No encontré la categoría "${params.categoryName ?? ""}" para el presupuesto. Tenés: ${categories.map((c) => c.name).join(", ")}.`,
        actions: [{ kind: "navigate", label: "Ver categorías", route: "/settings/categories" }],
      },
    };
  }

  const amount = params.amount;
  if (!amount) {
    return {
      source: "DATABASE",
      response: {
        type: "KAI_ACTION",
        state: "NEUTRAL",
        title: "Crear un presupuesto",
        body: `¿Cuál es el límite mensual para ${category.name}?`,
        actions: [{ kind: "navigate", label: "Crear desde el formulario", route: "/budgets/new" }],
      },
    };
  }

  const currencyCode = params.currencyHint === "USD" ? "USD" : baseCurrency;
  const confirmParams = { categoryId: category.id, categoryName: category.name, limitAmount: amount, currencyCode };
  return {
    source: "DATABASE",
    response: {
      type: "KAI_CONFIRMATION",
      state: "NEUTRAL",
      title: "Crear un presupuesto",
      body: `¿Creo un presupuesto de ${formatMoney(amount, currencyCode)} por mes para ${category.name}?`,
      data: { pendingBudget: confirmParams },
      actions: [
        { kind: "confirm-create-budget", label: "Crear presupuesto", params: confirmParams },
        { kind: "navigate", label: "Ver presupuestos", route: "/budgets" },
      ],
    },
  };
};

/**
 * "Anulá el último gasto" / "borrá el gasto de YPF" (spec §11). Finds the movement, shows a
 * confirmation with exactly what will be voided.
 */
export const voidTransaction: KaiHandler = async ({ ports, params }) => {
  const mode = params.mode === "merchant" ? "merchant" : "last";
  const tx = await ports.findTransactionToVoid({
    mode,
    ...(params.merchant ? { merchant: params.merchant } : {}),
    ...(params.ofType === "EXPENSE" || params.ofType === "INCOME" ? { ofType: params.ofType } : {}),
  });

  if (!tx) {
    return {
      source: "DATABASE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body:
          mode === "merchant"
            ? `No encontré un movimiento reciente que coincida con "${params.merchant ?? ""}".`
            : "No encontré un movimiento reciente para anular.",
        actions: [{ kind: "navigate", label: "Ver movimientos", route: "/transactions" }],
      },
    };
  }

  const noun = tx.type === "INCOME" ? "ingreso" : "gasto";
  const who = tx.merchant ?? tx.description;
  return {
    source: "DATABASE",
    response: {
      type: "KAI_CONFIRMATION",
      state: "ALERT",
      title: "Anular movimiento",
      body: `¿Anulo el ${noun} de ${formatMoney(tx.amount, tx.currencyCode)}${who ? ` en ${who}` : ""} del ${formatDayMonth(tx.occurredAt.slice(0, 10))}?`,
      data: { pendingVoid: { transactionId: tx.id } },
      actions: [
        { kind: "confirm-void", label: "Anular", params: { transactionId: tx.id } },
        { kind: "navigate", label: "Ver el movimiento", route: "/transactions" },
      ],
    },
  };
};
