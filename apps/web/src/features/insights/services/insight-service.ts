import {
  createBudgetQueries,
  createBudgetRepository,
  createCategoryRepository,
  createInsightRepository,
  createRecurringSeriesRepository,
  createSubscriptionRepository,
  createTransactionRepository,
  db,
  type Database,
  type InsightFeedbackValue,
} from "@know-finanzas/db";
import {
  reconcileInsights,
  sortByPriority,
  todayInTimezone,
  type InsightCandidate,
  type InsightConfidence,
  type InsightFamily,
} from "@know-finanzas/finance";

import { createReportService } from "@/features/reports/services/report-service";
import { createBudgetService } from "@/features/budgets/services/budget-service";
import { createGoalService } from "@/features/goals/services/goal-service";
import { createDashboardService } from "@/features/dashboard/services/dashboard-service";
import { createObligationReadModel } from "@/features/obligations/services/obligation-read-model";
import { createRecurringDetectionService } from "@/features/transactions/services/recurring-detection-service";
import {
  createAccountBalanceQueries,
  createActivityQueries,
  createDebtSummaryQueries,
  createMonthlySummaryQueries,
  createUpcomingObligationQueries,
} from "@know-finanzas/db";
import { DETECTORS, INSIGHT_CALCULATION_VERSION, type DetectorContext } from "../detectors";

/**
 * spec 09 §5 / §12 — families whose insights are "possible improvements, not urgent". They belong
 * in the Oportunidades subview, never in Para vos ("lo más importante ahora").
 */
export const OPPORTUNITY_FAMILIES = new Set<InsightFamily>(["INS-REC-DETECT"]);

export type InsightView = {
  id: string;
  family: InsightFamily;
  status: string;
  confidence: InsightConfidence;
  title: string;
  body: string;
  impactAmount: string | null;
  impactCurrency: string | null;
  cta: { label: string; href: string } | null;
  evidence: unknown;
  detectedAt: string;
};

function toView(row: {
  id: string;
  family: string;
  status: string;
  confidence: string;
  title: string;
  body: string;
  impactAmount: string | null;
  impactCurrency: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  evidence: unknown;
  detectedAt: Date;
}): InsightView {
  return {
    id: row.id,
    family: row.family as InsightFamily,
    status: row.status,
    confidence: row.confidence as InsightConfidence,
    title: row.title,
    body: row.body,
    impactAmount: row.impactAmount,
    impactCurrency: row.impactCurrency,
    cta: row.ctaLabel && row.ctaHref ? { label: row.ctaLabel, href: row.ctaHref } : null,
    evidence: row.evidence,
    detectedAt: row.detectedAt.toISOString(),
  };
}

export function createInsightService(database: Database = db, now: () => Date = () => new Date()) {
  const insights = createInsightRepository(database);
  const reports = createReportService(database);
  const transactions = createTransactionRepository(database);
  const budgetQueries = createBudgetQueries(database);
  const budgetService = createBudgetService({
    budgets: createBudgetRepository(database),
    categories: createCategoryRepository(database),
    budgetQueries,
  });
  const goalService = createGoalService(database);
  const activityQueries = createActivityQueries(database);
  const dashboard = createDashboardService({
    balances: createAccountBalanceQueries(database),
    monthly: createMonthlySummaryQueries(database),
    activity: activityQueries,
    debts: createDebtSummaryQueries(database),
    scheduled: createUpcomingObligationQueries(database),
  });
  const obligationReadModel = createObligationReadModel(database);
  const subscriptionRepository = createSubscriptionRepository(database);
  const recurringDetectionService = createRecurringDetectionService({
    transactions,
    recurringSeries: createRecurringSeriesRepository(database),
    categories: createCategoryRepository(database),
    now,
  });

  async function buildContext(user: { id: string; timezone: string; baseCurrency: string }): Promise<DetectorContext> {
    const nowDate = now();
    const today = todayInTimezone(nowDate, user.timezone);
    const report = await reports.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, now: nowDate });
    const [year, month] = report.period.split("-").map(Number);
    const periodRange = {
      from: `${report.period}-01`,
      to: `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01`,
    };
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const dayOfMonth = Number(today.slice(8, 10));

    const [budgets, goals, summary, uncategorizedCount, obligations, subscriptions, recurringSuggestions, recentExpenses] = await Promise.all([
      budgetService.getBudgetOverview({ id: user.id, timezone: user.timezone }).catch(() => []),
      goalService.listGoals({ id: user.id, timezone: user.timezone }, today).catch(() => []),
      dashboard.getDashboardSummary({ userId: user.id, timezone: user.timezone, now: nowDate }),
      transactions.countUncategorizedForUser(user.id),
      obligationReadModel
        .getObligations({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, horizonDays: 30, now: nowDate })
        .catch(() => ({ items: [] as Awaited<ReturnType<typeof obligationReadModel.getObligations>>["items"] })),
      subscriptionRepository.listForUser(user.id, "ACTIVE").catch(() => []),
      // Reads whatever the last scan (manual or cron) already found — this is not the place
      // to re-run the 400-day recurring-detection scan on every insight refresh.
      recurringDetectionService.listSuggestions(user.id).catch(() => []),
      activityQueries.listRecentActivity(user.id, { from: new Date(`${periodRange.from}T00:00:00Z`), limit: 200 }).catch(() => []),
    ]);

    const projection = summary.projections.find((p) => p.currencyCode === user.baseCurrency);
    const avgExpense = report.months
      .map((m) => Number(m.expense))
      .filter((n) => n > 0)
      .reduce((sum, n, _i, arr) => sum + n / arr.length, 0);
    // Same average, but over PAST completed months only — `report.months` ends with the
    // current in-progress month, and a run-rate baseline can't include part of itself.
    const priorMonthsExpense = report.months
      .slice(0, -1)
      .map((m) => Number(m.expense))
      .filter((n) => n > 0);
    const priorAvgExpense = priorMonthsExpense.length > 0 ? priorMonthsExpense.reduce((a, b) => a + b, 0) / priorMonthsExpense.length : 0;

    return {
      userId: user.id,
      currency: user.baseCurrency,
      today,
      period: report.period,
      periodRange,
      monthlyScale: avgExpense > 0 ? String(Math.round(avgExpense)) : null,
      budgets: budgets.map((b) => ({
        budgetId: b.budgetId,
        categoryName: b.categoryName,
        currencyCode: b.currencyCode,
        limit: b.limit,
        spent: b.spent,
        status: b.status,
      })),
      budgetPeriodProgressRatio: daysInMonth > 0 ? dayOfMonth / daysInMonth : 0,
      goals: goals
        .filter((g) => g.status === "ACTIVE")
        .map((g) => ({
          id: g.id,
          name: g.name,
          currencyCode: g.currencyCode,
          currentAmount: g.currentAmount,
          targetAmount: g.targetAmount,
          targetDate: g.targetDate,
          paceStatus: g.pace.status,
          requiredMonthly: g.pace.requiredMonthly,
          expectedProgressRatio: g.pace.expectedProgressRatio,
        })),
      cashflow: projection
        ? {
            currencyCode: projection.currencyCode,
            firstNegativeDate: projection.cashflow.firstNegativeDate,
            shortfallAmount: projection.cashflow.shortfallAmount?.toString() ?? null,
            committedObligations: projection.spendable.committedObligations.toString(),
          }
        : null,
      uncategorizedCount,
      categorySpendDeltas: report.expenseByCategory.map((slice) => ({
        categoryId: slice.id,
        categoryName: slice.name,
        amount: slice.amount,
        currencyCode: report.currencyCode,
        delta: slice.delta ?? null,
      })),
      spendPace: {
        spentSoFar: report.kpis.expense,
        dayOfMonth,
        daysInMonth,
        priorMonthlyAverage: priorAvgExpense > 0 ? String(Math.round(priorAvgExpense)) : null,
      },
      upcomingObligations: obligations.items.map((item) => ({
        id: item.sourceId,
        title: item.title,
        dueDate: item.dueDate,
        remainingAmount: item.remainingAmount,
        currencyCode: item.currencyCode,
        daysUntilDue: item.daysUntilDue,
        isOverdue: item.isOverdue,
        href: item.href,
      })),
      subscriptions: subscriptions.map((s) => {
        const history = Array.isArray(s.priceHistory) ? s.priceHistory : [];
        const prior = [...history].reverse().find((h) => h.amount !== s.currentAmount);
        return { id: s.id, label: s.label, currencyCode: s.currencyCode, currentAmount: s.currentAmount, previousAmount: prior?.amount ?? null };
      }),
      recurringSuggestions: recurringSuggestions.map((s) => ({
        id: s.id,
        label: s.label,
        typicalAmount: s.typicalAmount,
        currencyCode: s.currencyCode,
        occurrenceCount: s.occurrenceCount,
        confidence: s.confidence,
      })),
      recentExpenses: recentExpenses
        .filter((r) => r.type === "EXPENSE" && r.currencyCode === user.baseCurrency)
        .map((r) => ({
          id: r.id,
          description: r.description,
          merchant: r.merchant,
          amount: r.amount,
          currencyCode: r.currencyCode,
          occurredAt: r.occurredAt.toISOString(),
        })),
    };
  }

  return {
    /** Run the detectors and reconcile against what's stored (spec 09 §17/§18). */
    async refreshInsights(user: { id: string; timezone: string; baseCurrency: string }): Promise<void> {
      const ctx = await buildContext(user);
      const candidates: InsightCandidate[] = DETECTORS.flatMap((detector) => detector(ctx));
      const stored = (await insights.listOpenForUser(user.id)).concat(
        await insights.listForUser(user.id, { statuses: ["DISMISSED"] }),
      );
      const actions = reconcileInsights(
        candidates,
        stored.map((row) => ({
          id: row.id,
          family: row.family,
          dedupeKey: row.dedupeKey,
          status: row.status,
          body: row.body,
          dismissedAt: row.dismissedAt ? row.dismissedAt.toISOString() : null,
        })),
        now().toISOString(),
      );
      const byKey = new Map(candidates.map((c) => [c.dedupeKey, c]));

      for (const action of actions) {
        if (action.kind === "insert") {
          const c = action.candidate;
          await insights.insert({
            userId: user.id,
            family: c.family,
            dedupeKey: c.dedupeKey,
            status: "ACTIVE",
            confidence: c.confidence,
            title: c.title,
            body: c.body,
            impactAmount: c.impactAmount,
            impactCurrency: c.impactCurrency,
            ctaLabel: c.cta?.label ?? null,
            ctaHref: c.cta?.href ?? null,
            evidence: c.evidence,
            calculationVersion: INSIGHT_CALCULATION_VERSION,
          });
        } else if (action.kind === "update") {
          const c = byKey.get(action.candidate.dedupeKey)!;
          await insights.refresh(action.id, {
            title: c.title,
            body: c.body,
            confidence: c.confidence,
            impactAmount: c.impactAmount,
            impactCurrency: c.impactCurrency,
            ctaLabel: c.cta?.label ?? null,
            ctaHref: c.cta?.href ?? null,
            evidence: c.evidence,
            calculationVersion: INSIGHT_CALCULATION_VERSION,
            reactivate: action.reactivate,
          });
        } else if (action.kind === "resolve") {
          await insights.resolve(action.id, now());
        }
      }
    },

    async getQueue(user: { id: string; timezone: string; baseCurrency: string }, options: { refresh?: boolean } = {}) {
      if (options.refresh !== false) {
        await this.refreshInsights(user).catch(() => undefined);
      }
      const rows = await insights.listOpenForUser(user.id);
      return sortByPriority(rows.map(toView));
    },

    /**
     * spec 09 §11 "Para vos" — the priority queue minus opportunity-only families, plus the
     * §11.2 coverage/quality signal the surface must show alongside the list.
     */
    async getParaVos(user: { id: string; timezone: string; baseCurrency: string }) {
      const all = await this.getQueue(user);
      const items = all.filter((insight) => !OPPORTUNITY_FAMILIES.has(insight.family));
      const uncategorizedCount = await transactions.countUncategorizedForUser(user.id).catch(() => 0);
      return { items, coverage: { uncategorizedCount, generatedAt: now().toISOString() } };
    },

    /** spec 09 §12 "Oportunidades" — only the non-urgent opportunity families. */
    async getOpportunities(user: { id: string; timezone: string; baseCurrency: string }) {
      const all = await this.getQueue(user);
      return all.filter((insight) => OPPORTUNITY_FAMILIES.has(insight.family));
    },

    async getHistory(user: { id: string }) {
      const rows = await insights.listForUser(user.id, {
        statuses: ["DISMISSED", "RESOLVED", "EXPIRED", "SUPERSEDED", "INVALIDATED", "SEEN"],
      });
      return rows.map(toView);
    },

    async getDetail(user: { id: string }, insightId: string) {
      const row = await insights.findByIdForUser(insightId, user.id);
      if (!row) return null;
      if (row.status === "ACTIVE") {
        await insights.markSeenForUser(user.id, [row.id], now());
      }
      return toView(row);
    },

    async dismiss(user: { id: string }, insightId: string, feedback: InsightFeedbackValue | null) {
      return insights.dismissForUser(insightId, user.id, feedback, now());
    },

    async resolve(user: { id: string }, insightId: string) {
      return insights.resolveForUser(insightId, user.id, null, now());
    },
  };
}
