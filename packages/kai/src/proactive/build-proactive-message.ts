import type { KaiProactiveMessage } from "../domain/kai-proactive";
import type { KaiBudgetStatus, KaiMonthlyResult, KaiUpcomingObligation } from "../handlers/ports";
import { formatMoney, formatPercent } from "../templates/format";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export type ProactiveInput = {
  /** This calendar month, per currency. */
  monthly: KaiMonthlyResult[];
  /** Previous calendar month, per currency. */
  previousMonthly: KaiMonthlyResult[];
  topCategories: { label: string; amount: string; currencyCode: string }[];
  budgets: KaiBudgetStatus[];
  upcoming: KaiUpcomingObligation[];
  baseCurrency: string;
  /** YYYY-MM-DD in the user's timezone — makes the message id period-stable. */
  today: string;
};

/**
 * Deterministic proactive-message engine (spec §7, §8 priority). Returns the single most
 * important thing KAI would volunteer right now, or null if there's nothing worth interrupting
 * for. Priority order: Alerta (P1) → Analítico (P3) → Positivo (P4).
 */
export function buildProactiveMessage(input: ProactiveInput): KaiProactiveMessage | null {
  const period = input.today.slice(0, 7); // YYYY-MM
  const monthName = MONTHS[(Number(input.today.slice(5, 7)) - 1 + 12) % 12];
  const base = (rows: KaiMonthlyResult[]) => rows.find((r) => r.currencyCode === input.baseCurrency) ?? rows[0];

  // ── P1 — ALERTA ───────────────────────────────────────────────────────────
  const exceeded = input.budgets.find((b) => b.status === "EXCEEDED");
  const overdue = input.upcoming.find((o) => o.isOverdue);
  const dueSoon = input.upcoming.filter((o) => !o.isOverdue && o.daysUntilDue <= 3).sort((a, b) => a.daysUntilDue - b.daysUntilDue)[0];

  if (exceeded) {
    const over = Number(exceeded.spent) - Number(exceeded.limit);
    return {
      id: `alerta:budget:${exceeded.name}:${period}`,
      state: "ALERT",
      stateLabel: "Alerta",
      title: `Te pasaste del presupuesto de ${exceeded.name}.`,
      body: `Llevás ${formatMoney(exceeded.spent, exceeded.currencyCode)} sobre un límite de ${formatMoney(exceeded.limit, exceeded.currencyCode)} — ${formatMoney(String(over), exceeded.currencyCode)} de más.`,
      primary: { label: "Ver presupuestos", route: "/budgets" },
      secondary: { label: "Ver movimientos", route: "/transactions" },
      meta: "Alerta de presupuesto · atención",
      priority: 1,
    };
  }

  if (overdue || dueSoon) {
    const o = (overdue ?? dueSoon)!;
    const whenText = o.isOverdue
      ? "está vencido"
      : o.daysUntilDue === 0
        ? "vence hoy"
        : o.daysUntilDue === 1
          ? "vence mañana"
          : `vence en ${o.daysUntilDue} días`;
    return {
      id: `alerta:obligacion:${o.title}:${o.dueDate}`,
      state: "ALERT",
      stateLabel: "Alerta",
      title: o.isOverdue ? "Tenés un pago vencido." : "Se te viene un pago.",
      body: `${o.title} por ${formatMoney(o.amount, o.currencyCode)} ${whenText}.`,
      primary: { label: "Ver obligaciones", route: "/obligations" },
      secondary: { label: "Ver calendario", route: "/calendar" },
      meta: "Vencimiento próximo · atención",
      priority: 1,
    };
  }

  const thisM = base(input.monthly);
  const prevM = base(input.previousMonthly);

  // ── P3 — ANALÍTICO ────────────────────────────────────────────────────────
  const inBase = input.topCategories.filter((c) => c.currencyCode === input.baseCurrency && Number(c.amount) > 0);
  if (inBase.length >= 2) {
    const total = inBase.reduce((s, c) => s + Number(c.amount), 0);
    const sorted = [...inBase].sort((a, b) => Number(b.amount) - Number(a.amount));
    const head = sorted.slice(0, 3);
    const [first, second] = head;
    const marginNote =
      thisM && prevM && Number(thisM.net) < Number(prevM.net)
        ? " Si seguís esta tendencia, cerrarías el mes con menor margen de ahorro."
        : "";
    return {
      id: `analitico:categorias:${period}`,
      state: "ANALYTICAL",
      stateLabel: "Analítico",
      title: `Analicé tus movimientos de ${monthName}.`,
      body:
        `Detecté que tus mayores gastos estuvieron en ${first.label}` +
        (second ? ` y ${second.label}` : "") +
        `.${marginNote}`,
      data: {
        chart: {
          kind: "bar",
          currencyCode: input.baseCurrency,
          total: String(total),
          segments: head.map((c) => ({
            label: c.label,
            value: Number(c.amount),
            display: formatMoney(c.amount, c.currencyCode),
          })),
        },
      },
      primary: { label: "Ver análisis", route: "/reports/categories" },
      secondary: { label: "Ver presupuestos", route: "/budgets" },
      meta: "Insight financiero · datos procesados",
      priority: 3,
    };
  }

  // ── P4 — POSITIVO ─────────────────────────────────────────────────────────
  if (thisM && prevM) {
    const savings = Number(thisM.net);
    const prevSavings = Number(prevM.net);
    if (savings > 0 && prevSavings > 0 && savings >= prevSavings * 1.1) {
      const pct = ((savings - prevSavings) / prevSavings) * 100;
      return {
        id: `positivo:ahorro:${period}`,
        state: "POSITIVE",
        stateLabel: "Positivo",
        title: "¡Vas muy bien este mes!",
        body: `Aumentaste tu ahorro un ${formatPercent(pct)} respecto al mes pasado y mantuviste tus gastos dentro del presupuesto.`,
        primary: { label: "Ver mis avances", route: "/reports" },
        secondary: { label: "Crear nueva meta", route: "/goals" },
        meta: "Resumen mensual · progreso positivo",
        priority: 4,
      };
    }
  }

  return null;
}
