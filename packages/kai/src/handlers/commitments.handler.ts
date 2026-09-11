import { formatDayMonth, formatMoney, formatMoneyList, formatPercent } from "../templates/format";
import type { KaiMetricValue } from "../domain/kai-response";
import type { KaiHandler } from "./types";

const FREQUENCY_LABEL: Record<string, string> = {
  WEEKLY: "por semana",
  BIWEEKLY: "cada dos semanas",
  MONTHLY: "por mes",
  QUARTERLY: "por trimestre",
  YEARLY: "por año",
};

const MONTHLY_FACTOR: Record<string, number> = {
  WEEKLY: 52 / 12,
  BIWEEKLY: 26 / 12,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12,
};

const metric = (values: KaiMetricValue[]): { values: KaiMetricValue[] } => ({ values });

export const getUpcomingPayments: KaiHandler = async ({ ports }) => {
  const items = await ports.getUpcomingObligations(7);
  if (!items.length) {
    return {
      source: "DATABASE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: "No tenés pagos ni vencimientos en los próximos 7 días.",
        actions: [{ kind: "navigate", label: "Ver obligaciones", route: "/obligations" }],
      },
    };
  }
  const overdue = items.filter((i) => i.isOverdue);
  const next = items[0];
  const whenText = next.isOverdue
    ? "está vencido"
    : next.daysUntilDue === 0
      ? "vence hoy"
      : next.daysUntilDue === 1
        ? "vence mañana"
        : `vence el ${formatDayMonth(next.dueDate)}`;
  return {
    source: "DATABASE",
    response: {
      type: "KAI_TABLE",
      state: overdue.length || next.daysUntilDue <= 3 ? "ALERT" : "NEUTRAL",
      title: "Próximos vencimientos",
      body: `Tenés ${items.length} ${items.length === 1 ? "vencimiento" : "vencimientos"} en los próximos 7 días. El más cercano es ${next.title} por ${formatMoney(next.amount, next.currencyCode)} y ${whenText}.`,
      data: {
        table: {
          columns: ["Vence", "Concepto", "Monto"],
          rows: items.map((i) => [
            i.isOverdue ? "Vencido" : i.daysUntilDue === 0 ? "Hoy" : formatDayMonth(i.dueDate),
            i.title,
            formatMoney(i.amount, i.currencyCode),
          ]),
          rowTone: items.map((i) => (i.isOverdue ? "overdue" : i.daysUntilDue <= 3 ? "due-soon" : "normal")),
        },
      },
      actions: [{ kind: "navigate", label: "Ver obligaciones", route: "/obligations" }],
    },
  };
};

export const getSubscriptions: KaiHandler = async ({ ports }) => {
  const subs = await ports.getActiveSubscriptions();
  if (!subs.length) {
    return {
      source: "DATABASE",
      response: { type: "KAI_TEXT", state: "NEUTRAL", body: "No tengo suscripciones activas detectadas." },
    };
  }
  return {
    source: "DATABASE",
    response: {
      type: "KAI_TABLE",
      state: "NEUTRAL",
      title: "Suscripciones activas",
      body: `Tenés ${subs.length} ${subs.length === 1 ? "suscripción activa" : "suscripciones activas"}.`,
      data: {
        table: {
          columns: ["Servicio", "Monto", "Próx. cobro"],
          rows: subs.map((s) => [
            s.label,
            `${formatMoney(s.currentAmount, s.currencyCode)} ${FREQUENCY_LABEL[s.frequency] ?? ""}`.trim(),
            s.nextExpectedOn ? formatDayMonth(s.nextExpectedOn) : "—",
          ]),
        },
      },
      actions: [{ kind: "navigate", label: "Ver suscripciones", route: "/subscriptions" }],
    },
  };
};

export const getSubscriptionNext: KaiHandler = async ({ ports, params }) => {
  const subs = await ports.getActiveSubscriptions();
  const q = (params.subscription ?? "").toLowerCase().trim();
  if (!subs.length) {
    return { source: "DATABASE", response: { type: "KAI_TEXT", state: "NEUTRAL", body: "No tengo suscripciones activas detectadas." } };
  }
  const match = q
    ? subs.find((s) => s.label.toLowerCase().includes(q) || q.includes(s.label.toLowerCase()))
    : undefined;
  if (!match) {
    return {
      source: "DATABASE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: `No tengo una suscripción que coincida con "${params.subscription ?? ""}". Tenés: ${subs.map((s) => s.label).join(", ")}.`,
        actions: [{ kind: "navigate", label: "Ver suscripciones", route: "/subscriptions" }],
      },
    };
  }
  return {
    source: "DATABASE",
    response: {
      type: "KAI_METRIC",
      state: "NEUTRAL",
      title: match.label,
      body: match.nextExpectedOn
        ? `${match.label} se renueva el ${formatDayMonth(match.nextExpectedOn)} por ${formatMoney(match.currentAmount, match.currencyCode)}.`
        : `${match.label} cuesta ${formatMoney(match.currentAmount, match.currencyCode)}, pero todavía no tengo la próxima fecha de cobro.`,
      actions: [{ kind: "navigate", label: "Ver suscripción", route: "/subscriptions" }],
    },
  };
};

export const getSubscriptionCost: KaiHandler = async ({ ports }) => {
  const subs = await ports.getActiveSubscriptions();
  if (!subs.length) {
    return {
      source: "CALCULATOR",
      response: { type: "KAI_TEXT", state: "NEUTRAL", body: "No tengo suscripciones activas detectadas." },
    };
  }
  const byCurrency = new Map<string, number>();
  for (const s of subs) {
    const monthly = Number(s.currentAmount) * (MONTHLY_FACTOR[s.frequency] ?? 1);
    byCurrency.set(s.currencyCode, (byCurrency.get(s.currencyCode) ?? 0) + monthly);
  }
  const list = [...byCurrency.entries()].map(([currencyCode, amount]) => ({ amount: amount.toFixed(2), currencyCode }));
  return {
    source: "CALCULATOR",
    response: {
      type: "KAI_METRIC",
      state: "ANALYTICAL",
      title: "Costo de suscripciones",
      body: `Tus suscripciones activas suman aproximadamente ${formatMoneyList(list)} por mes.`,
      data: metric(list.map((m) => ({ label: `Suscripciones (${m.currencyCode})`, amount: m.amount, currencyCode: m.currencyCode }))),
      actions: [{ kind: "navigate", label: "Ver suscripciones", route: "/subscriptions" }],
    },
  };
};

export const getBudgetStatus: KaiHandler = async ({ ports }) => {
  const budgets = await ports.getBudgetStatus();
  if (!budgets.length) {
    return {
      source: "CALCULATOR",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: "Todavía no tenés presupuestos configurados.",
        actions: [{ kind: "navigate", label: "Crear un presupuesto", route: "/budgets" }],
      },
    };
  }
  const exceeded = budgets.filter((b) => b.status === "EXCEEDED");
  const near = budgets.filter((b) => b.status === "NEAR_LIMIT");
  let body: string;
  if (exceeded.length) {
    const b = exceeded[0];
    body = `Te pasaste del presupuesto de ${b.name}: llevás ${formatMoney(b.spent, b.currencyCode)} sobre un límite de ${formatMoney(b.limit, b.currencyCode)}.`;
  } else if (near.length) {
    const b = near[0];
    body = `Ya usaste el ${formatPercent(b.usagePercent)} de tu presupuesto de ${b.name}.`;
  } else {
    body = `Tus ${budgets.length} ${budgets.length === 1 ? "presupuesto va" : "presupuestos van"} dentro de lo previsto.`;
  }
  return {
    source: "CALCULATOR",
    response: {
      type: exceeded.length || near.length ? "KAI_ALERT" : "KAI_METRIC",
      state: exceeded.length || near.length ? "ALERT" : "POSITIVE",
      title: "Estado de presupuestos",
      body,
      data: metric(budgets.map((b) => ({
        label: `${b.name} — ${formatPercent(b.usagePercent)}`,
        amount: b.spent,
        currencyCode: b.currencyCode,
        hint: `límite ${formatMoney(b.limit, b.currencyCode)}`,
      }))),
      actions: [{ kind: "navigate", label: "Ver presupuestos", route: "/budgets" }],
    },
  };
};

export const getGoalProgress: KaiHandler = async ({ ports }) => {
  const goals = await ports.getGoalProgress();
  if (!goals.length) {
    return {
      source: "CALCULATOR",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: "Todavía no tenés metas de ahorro.",
        actions: [{ kind: "navigate", label: "Crear una meta", route: "/goals" }],
      },
    };
  }
  const reached = goals.filter((g) => g.status === "GOAL_REACHED");
  const lead = reached[0] ?? [...goals].sort((a, b) => b.actualProgressRatio - a.actualProgressRatio)[0];
  const pct = formatPercent(Math.round(lead.actualProgressRatio * 1000) / 10);
  let body: string;
  if (lead.status === "GOAL_REACHED") {
    body = `¡Alcanzaste tu meta ${lead.name}!`;
  } else if (lead.requiredMonthly) {
    body = `Vas ${pct} de tu meta ${lead.name}. Para llegar a tiempo necesitás aportar ${formatMoney(lead.requiredMonthly, lead.currencyCode)} por mes.`;
  } else {
    body = `Vas ${pct} de tu meta ${lead.name} (${formatMoney(lead.currentAmount, lead.currencyCode)} de ${formatMoney(lead.targetAmount, lead.currencyCode)}).`;
  }
  return {
    source: "CALCULATOR",
    response: {
      type: "KAI_METRIC",
      state: lead.status === "GOAL_REACHED" || lead.status === "ON_TRACK" ? "POSITIVE" : "ANALYTICAL",
      title: "Progreso de metas",
      body,
      data: metric(goals.map((g) => ({
        label: `${g.name} — ${formatPercent(Math.round(g.actualProgressRatio * 1000) / 10)}`,
        amount: g.currentAmount,
        currencyCode: g.currencyCode,
        hint: `objetivo ${formatMoney(g.targetAmount, g.currencyCode)}`,
      }))),
      actions: [{ kind: "navigate", label: "Ver metas", route: "/goals" }],
    },
  };
};

export const getInsights: KaiHandler = async ({ ports }) => {
  const insight = await ports.getTopInsight();
  if (!insight) {
    return {
      source: "RULE_ENGINE",
      response: {
        type: "KAI_TEXT",
        state: "POSITIVE",
        body: "No detecté nada que necesite tu atención ahora mismo.",
      },
    };
  }
  return {
    source: "RULE_ENGINE",
    response: {
      type: "KAI_INSIGHT",
      state: insight.severity === "critical" ? "ALERT" : insight.severity === "warning" ? "ALERT" : "ANALYTICAL",
      title: insight.title,
      body: insight.body,
      actions: insight.route ? [{ kind: "navigate", label: "Ver detalle", route: insight.route }] : undefined,
    },
  };
};
