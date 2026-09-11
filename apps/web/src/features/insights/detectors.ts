import { assessMateriality, type InsightCandidate, type InsightEvidence } from "@know-finanzas/finance";

export const INSIGHT_CALCULATION_VERSION = "insights-1";

export type DetectorContext = {
  userId: string;
  currency: string;
  today: string;
  period: string;
  periodRange: { from: string; to: string };
  /** User's typical monthly spend, for materiality scaling. */
  monthlyScale: string | null;
  budgets: Array<{
    budgetId: string;
    categoryName: string;
    currencyCode: string;
    limit: string;
    spent: string;
    status: "NORMAL" | "NEAR_LIMIT" | "EXCEEDED";
  }>;
  budgetPeriodProgressRatio: number;
  goals: Array<{
    id: string;
    name: string;
    currencyCode: string;
    currentAmount: string;
    targetAmount: string;
    targetDate: string | null;
    paceStatus: string;
    requiredMonthly: string | null;
    expectedProgressRatio: number | null;
  }>;
  cashflow: {
    currencyCode: string;
    firstNegativeDate: string | null;
    shortfallAmount: string | null;
    committedObligations: string;
  } | null;
  uncategorizedCount: number;
  /** Per-category expense this period vs the same category last period (spec 09 §21 INS-SPEND-DELTA). */
  categorySpendDeltas: Array<{
    categoryId: string;
    categoryName: string;
    amount: string;
    currencyCode: string;
    delta: { value: string; pct: number | null } | null;
  }>;
  /**
   * How far the current month's spend is tracking against the typical monthly total.
   * `priorMonthlyAverage` deliberately excludes the current (in-progress) month — comparing a
   * run-rate against a baseline that already includes part of itself is circular.
   */
  spendPace: { spentSoFar: string; dayOfMonth: number; daysInMonth: number; priorMonthlyAverage: string | null } | null;
  upcomingObligations: Array<{
    id: string;
    title: string;
    dueDate: string;
    remainingAmount: string;
    currencyCode: string;
    daysUntilDue: number;
    isOverdue: boolean;
    href: string | null;
  }>;
  subscriptions: Array<{
    id: string;
    label: string;
    currencyCode: string;
    currentAmount: string;
    previousAmount: string | null;
  }>;
  recurringSuggestions: Array<{
    id: string;
    label: string;
    typicalAmount: string;
    currencyCode: string;
    occurrenceCount: number;
    confidence: number;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    merchant: string | null;
    amount: string;
    currencyCode: string;
    occurredAt: string;
  }>;
};

function evidence(partial: Omit<InsightEvidence, "calculationVersion" | "generatedAt">): InsightEvidence {
  return { ...partial, calculationVersion: INSIGHT_CALCULATION_VERSION, generatedAt: new Date().toISOString() };
}

function fmt(amount: string, currency: string): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount));
}

// INS-BUDGET-LIMIT (spec 09 §22) — a budget near or over its limit, judged against how far
// through the month we are.
export function detectBudgetLimit(ctx: DetectorContext): InsightCandidate[] {
  const out: InsightCandidate[] = [];
  const pct = Math.round(ctx.budgetPeriodProgressRatio * 100);
  for (const budget of ctx.budgets) {
    if (budget.status === "NORMAL") continue;
    const used = Math.round((Number(budget.spent) / Math.max(1, Number(budget.limit))) * 100);
    const over = Number(budget.spent) - Number(budget.limit);

    out.push({
      family: "INS-BUDGET-LIMIT",
      dedupeKey: `INS-BUDGET-LIMIT:${budget.budgetId}:${ctx.period}`,
      sufficiency: "SUFFICIENT",
      confidence: "HIGH",
      title: budget.status === "EXCEEDED" ? `Presupuesto de ${budget.categoryName} excedido` : `Presupuesto de ${budget.categoryName} al límite`,
      body:
        budget.status === "EXCEEDED"
          ? `Ya gastaste ${fmt(budget.spent, budget.currencyCode)} de un límite de ${fmt(budget.limit, budget.currencyCode)} en ${budget.categoryName} — ${fmt(String(over), budget.currencyCode)} por encima.`
          : `Usaste ${used}% de tu presupuesto de ${budget.categoryName} y transcurrió ${pct}% del mes.`,
      impactAmount: budget.status === "EXCEEDED" ? String(over) : null,
      impactCurrency: budget.status === "EXCEEDED" ? budget.currencyCode : null,
      cta: { label: "Ver presupuesto", href: `/budgets/${budget.budgetId}` },
      evidence: evidence({
        sourceTypes: ["budget", "transaction"],
        sourceIds: [budget.budgetId],
        period: { from: ctx.periodRange.from, to: ctx.periodRange.to },
        currency: budget.currencyCode,
        metrics: { spent: budget.spent, limit: budget.limit, usedPercent: String(used), periodProgressPercent: String(pct) },
        dataQualityFlags: [],
      }),
    });
  }
  return out;
}

// INS-GOAL-PACE (spec 09 §22) — an active goal that's behind the rate it needs.
export function detectGoalPace(ctx: DetectorContext): InsightCandidate[] {
  const out: InsightCandidate[] = [];
  for (const goal of ctx.goals) {
    if (goal.paceStatus !== "NEEDS_MORE" || !goal.requiredMonthly) continue;
    out.push({
      family: "INS-GOAL-PACE",
      dedupeKey: `INS-GOAL-PACE:${goal.id}:${ctx.period}`,
      sufficiency: "SUFFICIENT",
      confidence: "MEDIUM",
      title: `Vas atrasado con "${goal.name}"`,
      body: `Para llegar a "${goal.name}" en la fecha prevista necesitás aportar aproximadamente ${fmt(goal.requiredMonthly, goal.currencyCode)} por mes.`,
      impactAmount: null,
      impactCurrency: null,
      cta: { label: "Ver meta", href: `/goals/${goal.id}` },
      evidence: evidence({
        sourceTypes: ["goal"],
        sourceIds: [goal.id],
        period: { from: ctx.periodRange.from, to: ctx.periodRange.to },
        currency: goal.currencyCode,
        metrics: {
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          requiredMonthly: goal.requiredMonthly,
          expectedProgressRatio: goal.expectedProgressRatio === null ? "" : goal.expectedProgressRatio.toFixed(3),
        },
        dataQualityFlags: [],
      }),
    });
  }
  return out;
}

// INS-CASH-RISK (spec 09 §26) — the 30-day projection dips below zero. Always labelled as a
// projection, never presented as a confirmed shortfall.
export function detectCashRisk(ctx: DetectorContext): InsightCandidate[] {
  if (!ctx.cashflow || !ctx.cashflow.firstNegativeDate || !ctx.cashflow.shortfallAmount) return [];
  const material = assessMateriality({
    family: "INS-CASH-RISK",
    amount: ctx.cashflow.shortfallAmount,
    relativeChange: null,
    monthlyScale: ctx.monthlyScale,
  });
  if (!material.material) return [];

  return [
    {
      family: "INS-CASH-RISK",
      dedupeKey: `INS-CASH-RISK:${ctx.cashflow.firstNegativeDate}`,
      sufficiency: "SUFFICIENT",
      confidence: "MEDIUM",
      title: "Posible faltante en los próximos 30 días",
      body: `Con los compromisos registrados, tu saldo proyectado podría quedar unos ${fmt(ctx.cashflow.shortfallAmount, ctx.cashflow.currencyCode)} por debajo de cero alrededor del ${ctx.cashflow.firstNegativeDate}. Es una proyección, no un saldo confirmado.`,
      impactAmount: `-${ctx.cashflow.shortfallAmount}`,
      impactCurrency: ctx.cashflow.currencyCode,
      cta: { label: "Ver flujo de caja", href: "/reports/cash-flow" },
      evidence: evidence({
        sourceTypes: ["account", "obligation"],
        sourceIds: [],
        period: { from: ctx.today, to: ctx.cashflow.firstNegativeDate },
        currency: ctx.cashflow.currencyCode,
        metrics: { shortfall: ctx.cashflow.shortfallAmount, committedObligations: ctx.cashflow.committedObligations },
        dataQualityFlags: [],
      }),
    },
  ];
}

// INS-DATA-QUALITY (spec 09 §22) — uncategorised movements degrade every report.
export function detectDataQuality(ctx: DetectorContext): InsightCandidate[] {
  if (ctx.uncategorizedCount < 5) return [];
  return [
    {
      family: "INS-DATA-QUALITY",
      dedupeKey: `INS-DATA-QUALITY:uncategorized`,
      sufficiency: "SUFFICIENT",
      confidence: "HIGH",
      title: `${ctx.uncategorizedCount} movimientos sin categoría`,
      body: `Tenés ${ctx.uncategorizedCount} gastos sin categoría. Categorizarlos mejora la lectura de tus reportes y presupuestos.`,
      impactAmount: null,
      impactCurrency: null,
      cta: { label: "Categorizar", href: "/transactions/pending" },
      evidence: evidence({
        sourceTypes: ["transaction"],
        sourceIds: [],
        period: { from: ctx.periodRange.from, to: ctx.periodRange.to },
        currency: ctx.currency,
        metrics: { uncategorizedCount: String(ctx.uncategorizedCount) },
        sampleSize: ctx.uncategorizedCount,
        dataQualityFlags: ["uncategorized_transactions"],
      }),
    },
  ];
}

// INS-SPEND-DELTA (spec 09 §21) — a category's spend moved materially vs the same category
// last period. `report.expenseByCategory[].delta` already carries the MoM comparison
// (spec 08 §14.2 "Vs. anterior"); this detector just filters it through materiality.
export function detectSpendDelta(ctx: DetectorContext): InsightCandidate[] {
  const out: InsightCandidate[] = [];
  for (const cat of ctx.categorySpendDeltas) {
    if (!cat.delta || cat.delta.pct === null) continue;
    const relativeChange = cat.delta.pct / 100;
    const material = assessMateriality({
      family: "INS-SPEND-DELTA",
      amount: cat.delta.value.replace("-", ""),
      relativeChange,
      monthlyScale: ctx.monthlyScale,
    });
    if (!material.material) continue;
    const up = Number(cat.delta.value) > 0;
    out.push({
      family: "INS-SPEND-DELTA",
      dedupeKey: `INS-SPEND-DELTA:${cat.categoryId}:${ctx.period}`,
      sufficiency: "SUFFICIENT",
      confidence: "MEDIUM",
      title: `${up ? "Subió" : "Bajó"} tu gasto en ${cat.categoryName}`,
      body: `Gastaste ${fmt(cat.amount, cat.currencyCode)} en ${cat.categoryName} este mes, ${Math.abs(cat.delta.pct)}% ${up ? "más" : "menos"} que el mes pasado.`,
      impactAmount: cat.delta.value,
      impactCurrency: cat.currencyCode,
      cta: { label: "Ver categoría", href: `/reports?category=${cat.categoryId}` },
      evidence: evidence({
        sourceTypes: ["transaction"],
        sourceIds: [cat.categoryId],
        period: { from: ctx.periodRange.from, to: ctx.periodRange.to },
        currency: cat.currencyCode,
        metrics: { amount: cat.amount, deltaValue: cat.delta.value, deltaPct: String(cat.delta.pct) },
        dataQualityFlags: [],
      }),
    });
  }
  return out;
}

// INS-SPEND-PACE (spec 09 §21) — at the current run-rate, the month will land materially
// above the typical monthly spend. Same shape as KAI's own GET_SPENDING_PROJECTION handler.
export function detectSpendPace(ctx: DetectorContext): InsightCandidate[] {
  if (!ctx.spendPace || !ctx.spendPace.priorMonthlyAverage) return [];
  const { spentSoFar, dayOfMonth, daysInMonth, priorMonthlyAverage } = ctx.spendPace;
  if (dayOfMonth < 5) return []; // too early in the month for a run-rate to mean much
  const projected = (Number(spentSoFar) / dayOfMonth) * daysInMonth;
  const scale = Number(priorMonthlyAverage);
  const relativeChange = scale > 0 ? (projected - scale) / scale : null;
  const material = assessMateriality({
    family: "INS-SPEND-PACE",
    amount: String(Math.round(projected - scale)),
    relativeChange,
    monthlyScale: ctx.monthlyScale,
  });
  if (!material.material || projected <= scale) return [];

  return [
    {
      family: "INS-SPEND-PACE",
      dedupeKey: `INS-SPEND-PACE:${ctx.period}`,
      sufficiency: "SUFFICIENT",
      confidence: "MEDIUM",
      title: "Vas por encima de tu ritmo habitual",
      body: `Llevás ${fmt(spentSoFar, ctx.currency)} en ${dayOfMonth} de ${daysInMonth} días. A este ritmo vas a terminar el mes en ${fmt(String(Math.round(projected)), ctx.currency)}, por encima de tu promedio mensual.`,
      impactAmount: String(Math.round(projected - scale)),
      impactCurrency: ctx.currency,
      cta: { label: "Ver proyección", href: "/reports/cash-flow" },
      evidence: evidence({
        sourceTypes: ["transaction"],
        sourceIds: [],
        period: { from: ctx.periodRange.from, to: ctx.periodRange.to },
        currency: ctx.currency,
        metrics: { spentSoFar, projected: String(Math.round(projected)), priorMonthlyAverage, dayOfMonth: String(dayOfMonth), daysInMonth: String(daysInMonth) },
        dataQualityFlags: [],
      }),
    },
  ];
}

// INS-OBL-DUE (spec 09 §21) — an obligation (debt installment, subscription, scheduled
// payment) is due soon or overdue. Reuses the same read model the Obligaciones view shows.
export function detectObligationDue(ctx: DetectorContext): InsightCandidate[] {
  const out: InsightCandidate[] = [];
  for (const item of ctx.upcomingObligations) {
    if (item.daysUntilDue > 7 && !item.isOverdue) continue;
    out.push({
      family: "INS-OBL-DUE",
      dedupeKey: `INS-OBL-DUE:${item.id}:${item.dueDate}`,
      sufficiency: "SUFFICIENT",
      confidence: "HIGH",
      title: item.isOverdue ? `${item.title} está vencido` : `${item.title} vence pronto`,
      body: item.isOverdue
        ? `${item.title} venció el ${item.dueDate} por ${fmt(item.remainingAmount, item.currencyCode)} y sigue sin saldarse.`
        : `${item.title} vence el ${item.dueDate} (en ${item.daysUntilDue} día${item.daysUntilDue === 1 ? "" : "s"}) por ${fmt(item.remainingAmount, item.currencyCode)}.`,
      impactAmount: item.remainingAmount,
      impactCurrency: item.currencyCode,
      cta: { label: "Ver obligación", href: item.href ?? "/obligations" },
      evidence: evidence({
        sourceTypes: ["obligation"],
        sourceIds: [item.id],
        period: { from: ctx.today, to: item.dueDate },
        currency: item.currencyCode,
        metrics: { remainingAmount: item.remainingAmount, daysUntilDue: String(item.daysUntilDue) },
        dataQualityFlags: [],
      }),
    });
  }
  return out;
}

// INS-REC-AMOUNT (spec 09 §21) — a recurring/subscription charge changed amount since its
// last known price. Same signal KAI's own subscription-price-change proactive rule uses.
export function detectRecurringAmountChange(ctx: DetectorContext): InsightCandidate[] {
  const out: InsightCandidate[] = [];
  for (const sub of ctx.subscriptions) {
    if (!sub.previousAmount || sub.previousAmount === sub.currentAmount) continue;
    const delta = Number(sub.currentAmount) - Number(sub.previousAmount);
    const relativeChange = Number(sub.previousAmount) > 0 ? delta / Number(sub.previousAmount) : null;
    const material = assessMateriality({
      family: "INS-REC-AMOUNT",
      amount: String(Math.abs(delta)),
      relativeChange,
      monthlyScale: ctx.monthlyScale,
    });
    if (!material.material) continue;
    const up = delta > 0;
    out.push({
      family: "INS-REC-AMOUNT",
      dedupeKey: `INS-REC-AMOUNT:${sub.id}:${sub.currentAmount}`,
      sufficiency: "SUFFICIENT",
      confidence: "HIGH",
      title: `${sub.label} ${up ? "aumentó" : "bajó"} de precio`,
      body: `${sub.label} pasó de ${fmt(sub.previousAmount, sub.currencyCode)} a ${fmt(sub.currentAmount, sub.currencyCode)}${relativeChange !== null ? ` (${up ? "+" : ""}${Math.round(relativeChange * 100)}%)` : ""}.`,
      impactAmount: String(delta),
      impactCurrency: sub.currencyCode,
      cta: { label: "Ver suscripciones", href: "/obligations/subscriptions" },
      evidence: evidence({
        sourceTypes: ["recurrence"],
        sourceIds: [sub.id],
        period: { from: ctx.periodRange.from, to: ctx.periodRange.to },
        currency: sub.currencyCode,
        metrics: { previousAmount: sub.previousAmount, currentAmount: sub.currentAmount },
        dataQualityFlags: [],
      }),
    });
  }
  return out;
}

// INS-REC-DETECT (spec 09 §21) — a recurring pattern was found but never confirmed as a
// subscription/recurring expense. Opportunity-only (spec 09 §5/§12), never "Para vos".
export function detectRecurringPattern(ctx: DetectorContext): InsightCandidate[] {
  return ctx.recurringSuggestions.map((s) => ({
    family: "INS-REC-DETECT",
    dedupeKey: `INS-REC-DETECT:${s.id}`,
    sufficiency: "SUFFICIENT",
    confidence: s.confidence >= 0.8 ? "HIGH" : s.confidence >= 0.6 ? "MEDIUM" : "LOW",
    title: `Parece un gasto recurrente: ${s.label}`,
    body: `Detecté ${s.occurrenceCount} pagos parecidos a ${s.label} por ${fmt(s.typicalAmount, s.currencyCode)}. ¿Lo marco como recurrente?`,
    impactAmount: null,
    impactCurrency: null,
    cta: { label: "Revisar sugerencia", href: "/transactions/recurring" },
    evidence: evidence({
      sourceTypes: ["recurrence"],
      sourceIds: [s.id],
      period: { from: ctx.periodRange.from, to: ctx.periodRange.to },
      currency: s.currencyCode,
      metrics: { typicalAmount: s.typicalAmount, occurrenceCount: String(s.occurrenceCount), confidence: String(s.confidence) },
      dataQualityFlags: [],
    }),
  }));
}

// INS-ANOMALY-AMOUNT (spec 09 §21) — a single expense that dwarfs the user's typical
// movement — the same ≥4×-median heuristic KAI's proactive "large-transaction" rule uses.
export function detectAmountAnomaly(ctx: DetectorContext): InsightCandidate[] {
  const expenses = ctx.recentExpenses;
  if (expenses.length < 5) return [];
  const amounts = expenses.map((e) => Number(e.amount)).sort((a, b) => a - b);
  const median = amounts[Math.floor(amounts.length / 2)];
  if (median <= 0) return [];

  const out: InsightCandidate[] = [];
  for (const e of expenses) {
    const amount = Number(e.amount);
    if (amount < median * 4) continue;
    const material = assessMateriality({
      family: "INS-ANOMALY-AMOUNT",
      amount: e.amount,
      relativeChange: (amount - median) / median,
      monthlyScale: ctx.monthlyScale,
    });
    if (!material.material) continue;
    const who = e.merchant ?? e.description;
    out.push({
      family: "INS-ANOMALY-AMOUNT",
      dedupeKey: `INS-ANOMALY-AMOUNT:${e.id}`,
      sufficiency: "SUFFICIENT",
      confidence: "MEDIUM",
      title: "Un gasto se destaca del resto",
      body: `${who ? `${who}: ` : ""}${fmt(e.amount, e.currencyCode)} — bastante más que tus otros movimientos de este mes.`,
      impactAmount: e.amount,
      impactCurrency: e.currencyCode,
      cta: { label: "Ver movimiento", href: "/transactions" },
      evidence: evidence({
        sourceTypes: ["transaction"],
        sourceIds: [e.id],
        period: { from: ctx.periodRange.from, to: ctx.periodRange.to },
        currency: e.currencyCode,
        metrics: { amount: e.amount, median: String(median) },
        dataQualityFlags: [],
      }),
    });
  }
  return out;
}

export const DETECTORS = [
  detectCashRisk,
  detectBudgetLimit,
  detectGoalPace,
  detectDataQuality,
  detectSpendDelta,
  detectSpendPace,
  detectObligationDue,
  detectRecurringAmountChange,
  detectRecurringPattern,
  detectAmountAnomaly,
] as const;
