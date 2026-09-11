import type { KaiProactiveMessage } from "../domain/kai-proactive";
import type { KaiBudgetStatus, KaiMonthlyResult, KaiProactiveInsight, KaiUpcomingObligation } from "../handlers/ports";
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
  /** Same categories, previous month — for the spike rule. */
  previousTopCategories?: { label: string; amount: string; currencyCode: string }[];
  budgets: KaiBudgetStatus[];
  upcoming: KaiUpcomingObligation[];
  /** Active subscriptions — `previousAmount` set when the price changed vs the prior charge. */
  subscriptions?: {
    label: string;
    currencyCode: string;
    currentAmount: string;
    previousAmount?: string | null;
    nextExpectedOn: string | null;
  }[];
  /** This month's POSTED expenses — for the "gasto inusualmente grande" rule. */
  recentExpenses?: { description: string; merchant: string | null; amount: string; currencyCode: string }[];
  /** Goal progress for the milestone rule. */
  goals?: { name: string; actualProgressRatio: number }[];
  /** The insight queue (already detected + prioritised by the insight engine). */
  insights?: KaiProactiveInsight[];
  baseCurrency: string;
  /** YYYY-MM-DD in the user's timezone — makes the message id period-stable. */
  today: string;
};

/**
 * Deterministic proactive-message engine (spec §7, §8). Returns **every** message KAI could
 * volunteer right now, each tagged with kind / priority (P0 crítico … P5 consejo) / expiry.
 * The queue + frequency cap (`selectProactive`) decides which one, if any, to actually show.
 */
export function buildProactiveCandidates(input: ProactiveInput): KaiProactiveMessage[] {
  const out: KaiProactiveMessage[] = [];
  const period = input.today.slice(0, 7); // YYYY-MM
  const monthName = MONTHS[(Number(input.today.slice(5, 7)) - 1 + 12) % 12];
  const base = (rows: KaiMonthlyResult[]) => rows.find((r) => r.currencyCode === input.baseCurrency) ?? rows[0];

  // ── P1 — presupuesto excedido ─────────────────────────────────────────────
  for (const b of input.budgets.filter((x) => x.status === "EXCEEDED")) {
    const over = Number(b.spent) - Number(b.limit);
    out.push({
      id: `budget-exceeded:${b.name}:${period}`,
      kind: "budget-exceeded",
      state: "ALERT",
      stateLabel: "Alerta",
      title: `Te pasaste del presupuesto de ${b.name}.`,
      body: `Llevás ${formatMoney(b.spent, b.currencyCode)} sobre un límite de ${formatMoney(b.limit, b.currencyCode)} — ${formatMoney(String(over), b.currencyCode)} de más.`,
      primary: { label: "Ver presupuestos", route: "/budgets" },
      secondary: { label: "Ver movimientos", route: "/transactions" },
      meta: "Alerta de presupuesto · atención",
      priority: 1,
      expiresInHours: null,
    });
  }

  // ── P1 — vencimiento vencido / ≤ 3 días ───────────────────────────────────
  const overdue = input.upcoming.find((o) => o.isOverdue);
  const dueSoon = input.upcoming
    .filter((o) => !o.isOverdue && o.daysUntilDue <= 3)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)[0];
  const o = overdue ?? dueSoon;
  if (o) {
    const whenText = o.isOverdue
      ? "está vencido"
      : o.daysUntilDue === 0
        ? "vence hoy"
        : o.daysUntilDue === 1
          ? "vence mañana"
          : `vence en ${o.daysUntilDue} días`;
    out.push({
      id: `obligation-due:${o.title}:${o.dueDate}`,
      kind: "obligation-due",
      state: "ALERT",
      stateLabel: "Alerta",
      title: o.isOverdue ? "Tenés un pago vencido." : "Se te viene un pago.",
      body: `${o.title} por ${formatMoney(o.amount, o.currencyCode)} ${whenText}.`,
      primary: { label: "Ver obligaciones", route: "/obligations" },
      secondary: { label: "Ver calendario", route: "/calendar" },
      meta: "Vencimiento próximo · atención",
      priority: 1,
      expiresInHours: 72,
    });
  }

  // ── P2 — presupuesto al límite (80–100%) ──────────────────────────────────
  const near = input.budgets.find((b) => b.status === "NEAR_LIMIT");
  if (near) {
    out.push({
      id: `budget-near-limit:${near.name}:${period}`,
      kind: "budget-near-limit",
      state: "ALERT",
      stateLabel: "Alerta",
      title: `Estás cerca del límite en ${near.name}.`,
      body: `Ya usaste el ${formatPercent(near.usagePercent)} de tu presupuesto de ${near.name} este mes.`,
      primary: { label: "Ver presupuestos", route: "/budgets" },
      secondary: { label: "Ver movimientos", route: "/transactions" },
      meta: "Alerta de presupuesto · atención",
      priority: 2,
      expiresInHours: null,
    });
  }

  // ── P2 — suscripción que vence en ≤ 7 días ────────────────────────────────
  for (const s of input.subscriptions ?? []) {
    if (!s.nextExpectedOn) continue;
    const days = daysBetween(input.today, s.nextExpectedOn);
    if (days >= 0 && days <= 7) {
      out.push({
        id: `subscription-due:${s.label}:${s.nextExpectedOn}`,
        kind: "subscription-due",
        state: "ALERT",
        stateLabel: "Alerta",
        title: `${s.label} se renueva pronto.`,
        body: `Se debita ${formatMoney(s.currentAmount, s.currencyCode)} ${days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`}.`,
        primary: { label: "Ver suscripciones", route: "/subscriptions" },
        secondary: { label: "Ver obligaciones", route: "/obligations" },
        meta: "Suscripción · recordatorio",
        priority: 2,
        expiresInHours: 48,
      });
      break;
    }
  }

  // ── Insights ya detectados por el motor (spec §4) ────────────────────────
  for (const ins of input.insights ?? []) {
    out.push({
      id: `insight:${ins.id}`,
      kind: "month-review",
      state: ins.severity === "critical" ? "ALERT" : ins.severity === "warning" ? "ALERT" : "ANALYTICAL",
      stateLabel: ins.severity === "info" ? "Analítico" : "Alerta",
      title: ins.title,
      body: ins.body,
      primary: ins.route ? { label: "Ver detalle", route: ins.route } : { label: "Ver insights", route: "/insights" },
      secondary: { label: "Ver reportes", route: "/reports" },
      meta: "Insight de KAI · datos procesados",
      priority: ins.severity === "critical" ? 1 : ins.severity === "warning" ? 3 : 4,
      expiresInHours: null,
    });
  }

  // ── P2 — una suscripción cambió de precio ────────────────────────────────
  for (const s of input.subscriptions ?? []) {
    if (!s.previousAmount || Number(s.previousAmount) <= 0) continue;
    const cur = Number(s.currentAmount);
    const pre = Number(s.previousAmount);
    if (Math.abs(cur - pre) / pre < 0.03) continue; // ignore rounding noise
    const pct = ((cur - pre) / pre) * 100;
    out.push({
      id: `subscription-price-change:${s.label}:${s.currentAmount}`,
      kind: "subscription-price-change",
      state: "ANALYTICAL",
      stateLabel: "Analítico",
      title: `${s.label} ${cur > pre ? "aumentó" : "bajó"} de precio.`,
      body: `Pasó de ${formatMoney(s.previousAmount, s.currencyCode)} a ${formatMoney(s.currentAmount, s.currencyCode)} (${cur > pre ? "+" : ""}${formatPercent(pct)}).`,
      primary: { label: "Ver suscripciones", route: "/subscriptions" },
      secondary: { label: "Ver obligaciones", route: "/obligations" },
      meta: "Suscripción · cambio de precio",
      priority: 2,
      expiresInHours: null,
    });
    break;
  }

  // ── P3 — un gasto inusualmente grande ────────────────────────────────────
  const expenses = (input.recentExpenses ?? []).filter((e) => e.currencyCode === input.baseCurrency && Number(e.amount) > 0);
  if (expenses.length >= 5) {
    const amounts = expenses.map((e) => Number(e.amount)).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const biggest = expenses.reduce((max, e) => (Number(e.amount) > Number(max.amount) ? e : max));
    if (median > 0 && Number(biggest.amount) >= median * 4 && Number(biggest.amount) >= median + 1) {
      const who = biggest.merchant ?? biggest.description ?? "un movimiento";
      out.push({
        id: `large-transaction:${who}:${biggest.amount}:${period}`,
        kind: "large-transaction",
        state: "ANALYTICAL",
        stateLabel: "Analítico",
        title: "Registraste un gasto grande.",
        body: `${formatMoney(biggest.amount, biggest.currencyCode)} en ${who} — bastante más que tu gasto habitual (~${formatMoney(String(Math.round(median)), input.baseCurrency)}).`,
        primary: { label: "Ver movimientos", route: "/transactions" },
        secondary: { label: "Ver reporte", route: "/reports" },
        meta: "Movimiento inusual · datos procesados",
        priority: 3,
        expiresInHours: 72,
      });
    }
  }

  const thisM = base(input.monthly);
  const prevM = base(input.previousMonthly);

  // ── P3 — suba de categoría (+20% mes a mes) ───────────────────────────────
  if (input.previousTopCategories?.length) {
    const prevByLabel = new Map(
      input.previousTopCategories.filter((c) => c.currencyCode === input.baseCurrency).map((c) => [c.label, Number(c.amount)]),
    );
    for (const c of input.topCategories.filter((x) => x.currencyCode === input.baseCurrency)) {
      const prev = prevByLabel.get(c.label);
      const cur = Number(c.amount);
      if (prev && prev > 0 && cur >= prev * 1.2) {
        const pct = ((cur - prev) / prev) * 100;
        out.push({
          id: `category-spike:${c.label}:${period}`,
          kind: "category-spike",
          state: "ANALYTICAL",
          stateLabel: "Analítico",
          title: `Tus gastos en ${c.label} subieron.`,
          body: `Este mes llevás ${formatMoney(c.amount, c.currencyCode)} en ${c.label}, un ${formatPercent(pct)} más que el mes pasado.`,
          primary: { label: "Ver movimientos", route: "/transactions" },
          secondary: { label: "Ver presupuestos", route: "/budgets" },
          meta: "Insight financiero · datos procesados",
          priority: 3,
          expiresInHours: null,
        });
        break;
      }
    }
  }

  // ── P3 — análisis mensual (≥ 2 categorías) ────────────────────────────────
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
    out.push({
      id: `month-review:categorias:${period}`,
      kind: "month-review",
      state: "ANALYTICAL",
      stateLabel: "Analítico",
      title: `Analicé tus movimientos de ${monthName}.`,
      body: `Detecté que tus mayores gastos estuvieron en ${first.label}${second ? ` y ${second.label}` : ""}.${marginNote}`,
      data: {
        chart: {
          kind: "bar",
          currencyCode: input.baseCurrency,
          total: String(total),
          segments: head.map((c) => ({ label: c.label, value: Number(c.amount), display: formatMoney(c.amount, c.currencyCode) })),
        },
      },
      primary: { label: "Ver análisis", route: "/reports/categories" },
      secondary: { label: "Ver presupuestos", route: "/budgets" },
      meta: "Insight financiero · datos procesados",
      priority: 3,
      expiresInHours: null,
    });
  }

  // ── P4 — meta que cruza un hito (25 / 50 / 75 / 100%) ─────────────────────
  for (const g of input.goals ?? []) {
    const pct = Math.round(g.actualProgressRatio * 100);
    const milestone = [100, 75, 50, 25].find((m) => pct >= m);
    if (milestone) {
      out.push({
        id: `goal-milestone:${g.name}:${milestone}`,
        kind: "goal-milestone",
        state: "POSITIVE",
        stateLabel: "Positivo",
        title: milestone === 100 ? `¡Alcanzaste tu meta ${g.name}!` : `Vas por el ${milestone}% de tu meta ${g.name}.`,
        body:
          milestone === 100
            ? "La completaste. Si querés, arrancá una nueva."
            : `Seguís sumando — ya llevás ${pct}% de lo que te propusiste.`,
        primary: { label: "Ver metas", route: "/goals" },
        secondary: { label: "Aportar ahora", route: "/goals" },
        meta: "Progreso de meta · logro",
        priority: 4,
        expiresInHours: null,
      });
      break;
    }
  }

  // ── P4 — ahorro creció > 10% mes a mes ───────────────────────────────────
  if (thisM && prevM) {
    const savings = Number(thisM.net);
    const prevSavings = Number(prevM.net);
    if (savings > 0 && prevSavings > 0 && savings >= prevSavings * 1.1) {
      const pct = ((savings - prevSavings) / prevSavings) * 100;
      out.push({
        id: `savings-up:${period}`,
        kind: "savings-up",
        state: "POSITIVE",
        stateLabel: "Positivo",
        title: "¡Vas muy bien este mes!",
        body: `Aumentaste tu ahorro un ${formatPercent(pct)} respecto al mes pasado y mantuviste tus gastos dentro del presupuesto.`,
        primary: { label: "Ver mis avances", route: "/reports" },
        secondary: { label: "Crear nueva meta", route: "/goals" },
        meta: "Resumen mensual · progreso positivo",
        priority: 4,
        expiresInHours: null,
      });
    }
  }

  return out.sort((a, b) => a.priority - b.priority);
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.UTC(+fromISO.slice(0, 4), +fromISO.slice(5, 7) - 1, +fromISO.slice(8, 10));
  const b = Date.UTC(+toISO.slice(0, 4), +toISO.slice(5, 7) - 1, +toISO.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}
