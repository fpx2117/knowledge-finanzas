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

export const DETECTORS = [detectCashRisk, detectBudgetLimit, detectGoalPace, detectDataQuality] as const;
