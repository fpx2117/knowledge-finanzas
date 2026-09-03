import {
  budgetRepository,
  categoryRepository,
  createBudgetQueries,
  createUpcomingObligationQueries,
  db,
} from "@know-finanzas/db";
import { Money, monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

import { createReportService } from "@/features/reports/services/report-service";
import { createBudgetService } from "@/features/budgets/services/budget-service";

export type InsightTab = "resumen" | "gastos" | "ingresos" | "ahorro" | "deudas" | "habitos";

export type HealthBand = "solida" | "estable" | "ajustada" | "riesgo";

export type ScoreComponent = { key: string; label: string; score: number; detail: string };

export type AnalyticalCard = { title: string; body: string; trend?: "up" | "down" | "flat" };

export type InsightData = {
  period: string;
  currencyCode: string;
  health: {
    score: number;
    band: HealthBand;
    headline: string;
    reasons: string[];
    components: ScoreComponent[];
  };
  analytical: AnalyticalCard[];
  personalized: AnalyticalCard[];
  recommendation: { text: string; ctaLabel: string; ctaHref: string };
};

const BAND_META: Record<HealthBand, { min: number; headline: string }> = {
  solida: { min: 75, headline: "Tu situación financiera está sólida." },
  estable: { min: 55, headline: "Vas estable, con margen para mejorar." },
  ajustada: { min: 35, headline: "El mes viene ajustado." },
  riesgo: { min: 0, headline: "Hay señales de riesgo para atender." },
};

function bandForScore(score: number): HealthBand {
  if (score >= 75) return "solida";
  if (score >= 55) return "estable";
  if (score >= 35) return "ajustada";
  return "riesgo";
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const num = (value: string) => Number(value);

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function createInsightService(database = db) {
  const reports = createReportService(database);
  const budgetQueries = createBudgetQueries(database);
  const obligations = createUpcomingObligationQueries(database);
  const budgetService = createBudgetService({
    budgets: budgetRepository,
    categories: categoryRepository,
    budgetQueries,
  });

  return {
    async getInsights(input: {
      userId: string;
      timezone: string;
      baseCurrency: string;
      period?: string;
      now?: Date;
    }): Promise<InsightData> {
      const now = input.now ?? new Date();
      const currencyCode = input.baseCurrency;
      const today = todayInTimezone(now, input.timezone);

      const report = await reports.getReport({ ...input, now });
      const [year, month] = report.period.split("-").map(Number);
      const prev = new Date(Date.UTC(year, month - 2, 1));
      const prevRange = monthRangeForTimezone(prev.getUTCFullYear(), prev.getUTCMonth() + 1, input.timezone);

      const [prevCategorySpend, upcomingInstallments, budgetOverview] = await Promise.all([
        budgetQueries.getCategorySpendingForUser(input.userId, { from: prevRange.start, to: prevRange.end }),
        obligations.listDebtInstallmentsForUser(input.userId, { from: today, to: addDays(today, 30) }),
        budgetService.getBudgetOverview({ id: input.userId, timezone: input.timezone } as never).catch(() => []),
      ]);

      // ---- Deterministic aggregates ----
      const monthsWithData = report.months.filter((m) => num(m.income) > 0 || num(m.expense) > 0);
      const avgIncome = monthsWithData.length
        ? monthsWithData.reduce((sum, m) => sum + num(m.income), 0) / monthsWithData.length
        : num(report.kpis.income);
      const avgExpense = monthsWithData.length
        ? monthsWithData.reduce((sum, m) => sum + num(m.expense), 0) / monthsWithData.length
        : num(report.kpis.expense);

      // Net worth (assets − debt) is a conservative proxy for the emergency buffer:
      // liquid assets alone aren't exposed by the report service.
      const bufferMonths = avgExpense > 0 ? Math.max(0, num(report.kpis.netWorth)) / avgExpense : 0;

      const positiveMonths = monthsWithData.filter((m) => num(m.net) >= 0).length;
      const hasTrendHistory = monthsWithData.length >= 2;
      const trendRatio = hasTrendHistory ? positiveMonths / monthsWithData.length : 0.5;

      const budgetsExceeded = budgetOverview.filter((b) => b.status === "EXCEEDED").length;
      const budgetAdherence = budgetOverview.length
        ? 1 - budgetsExceeded / budgetOverview.length
        : 0.6;

      const savingsRate = report.kpis.savingsRate / 100;

      const components: ScoreComponent[] = [
        {
          key: "savings",
          label: "Tasa de ahorro",
          score: num(report.kpis.savings) < 0 ? 0 : clamp01(savingsRate / 0.2),
          detail:
            num(report.kpis.savings) < 0
              ? "Gastaste más de lo que ingresó este mes."
              : `Ahorrás el ${report.kpis.savingsRate}% de tus ingresos.`,
        },
        {
          key: "buffer",
          label: "Colchón de emergencia",
          score: clamp01(bufferMonths / 6),
          detail:
            bufferMonths >= 1
              ? `Tu patrimonio líquido cubre ~${bufferMonths.toFixed(1)} meses de gastos.`
              : "Tu colchón cubre menos de un mes de gastos.",
        },
        {
          key: "trend",
          label: "Tendencia de los últimos meses",
          score: clamp01(trendRatio),
          detail: hasTrendHistory
            ? `${positiveMonths} de ${monthsWithData.length} meses cerraron en positivo.`
            : "Todavía no hay suficiente historial para leer una tendencia (se asume neutral).",
        },
        {
          key: "budgets",
          label: "Cumplimiento de presupuestos",
          score: clamp01(budgetAdherence),
          detail: budgetOverview.length
            ? `${budgetOverview.length - budgetsExceeded} de ${budgetOverview.length} presupuestos dentro del límite.`
            : "Todavía no tenés presupuestos para seguir.",
        },
      ];

      const weights: Record<string, number> = { savings: 0.35, buffer: 0.3, trend: 0.15, budgets: 0.2 };
      const score = Math.round(
        components.reduce((sum, component) => sum + component.score * (weights[component.key] ?? 0), 0) * 100,
      );
      const band = bandForScore(score);

      const sorted = [...components].sort((a, b) => b.score - a.score);
      const reasons = [sorted[0].detail, sorted.at(-1)!.detail].filter(Boolean);

      // ---- Analytical cards ----
      const prevExpenseByCategory = new Map<string, number>();
      for (const row of prevCategorySpend) {
        if (row.currencyCode !== currencyCode || !row.categoryId) continue;
        prevExpenseByCategory.set(row.categoryId, num(row.netExpense ?? row.expenseTotal));
      }

      const expenseTrendPct =
        avgExpense > 0 ? Math.round(((num(report.kpis.expense) - avgExpense) / avgExpense) * 100) : 0;

      const growth = report.expenseByCategory
        .map((slice) => ({
          name: slice.name,
          delta: num(slice.amount) - (prevExpenseByCategory.get(slice.id) ?? 0),
        }))
        .filter((entry) => entry.delta > 0)
        .sort((a, b) => b.delta - a.delta)[0];

      const topExpense = report.expenseByCategory[0];

      const analytical: AnalyticalCard[] = [
        {
          title: "Evolución del gasto",
          trend: expenseTrendPct > 3 ? "up" : expenseTrendPct < -3 ? "down" : "flat",
          body:
            expenseTrendPct > 3
              ? `Gastaste ${expenseTrendPct}% más que tu promedio de los últimos meses.`
              : expenseTrendPct < -3
                ? `Gastaste ${Math.abs(expenseTrendPct)}% menos que tu promedio reciente. Buen mes.`
                : "Tu gasto de este mes está en línea con tu promedio reciente.",
        },
        {
          title: "Categoría que más creció",
          trend: growth ? "up" : "flat",
          body: growth
            ? `${growth.name} subió respecto al mes pasado. Revisá si fue puntual o es una tendencia.`
            : "Ninguna categoría de gasto creció respecto al mes pasado.",
        },
        {
          title: "Oportunidad de ahorro",
          body: topExpense
            ? `${topExpense.name} es tu mayor gasto (${Math.round(topExpense.share * 100)}%). Bajarlo 10% liberaría ${currencyCode} ${Math.round(num(topExpense.amount) * 0.1).toLocaleString("es-AR")} al mes.`
            : "Cargá tus gastos con categoría para detectar dónde podés recortar.",
        },
      ];

      // ---- Personalized ----
      const upcomingTotal = upcomingInstallments
        .filter((row) => row.debt.currencyCode === currencyCode)
        .reduce(
          (total, row) =>
            total.add(
              Money.fromString(row.installment.totalAmount, currencyCode).subtract(
                Money.fromString(row.allocatedAmount, currencyCode),
              ),
            ),
          Money.zero(currencyCode),
        );
      const incomeGrowthPct =
        avgIncome > 0 ? Math.round(((num(report.kpis.income) - avgIncome) / avgIncome) * 100) : 0;

      const personalized: AnalyticalCard[] = [
        {
          title: "Pagos próximos",
          body:
            upcomingInstallments.length > 0
              ? `Tenés ${upcomingInstallments.length} ${upcomingInstallments.length === 1 ? "cuota" : "cuotas"} por ${currencyCode} ${Math.round(num(upcomingTotal.toString())).toLocaleString("es-AR")} en los próximos 30 días.`
              : "No tenés cuotas ni obligaciones por vencer en los próximos 30 días.",
        },
        {
          title: "Evolución de ingresos",
          trend: incomeGrowthPct > 3 ? "up" : incomeGrowthPct < -3 ? "down" : "flat",
          body:
            incomeGrowthPct > 3
              ? `Tus ingresos de este mes están ${incomeGrowthPct}% por encima de tu promedio reciente.`
              : incomeGrowthPct < -3
                ? `Tus ingresos cayeron ${Math.abs(incomeGrowthPct)}% respecto a tu promedio reciente.`
                : "Tus ingresos se mantienen estables respecto a los últimos meses.",
        },
        {
          title: "Progreso de metas",
          body: "Todavía no cargaste metas de ahorro. Definir una te ayuda a darle un objetivo al excedente del mes.",
        },
      ];

      // ---- Primary recommendation: address the weakest component ----
      const weakest = sorted.at(-1)!;
      const RECOMMENDATION: Record<string, { text: string; ctaLabel: string; ctaHref: string }> = {
        savings: {
          text: "Este mes gastaste casi todo lo que ingresó. Fijá un presupuesto en tu categoría más grande para recuperar margen.",
          ctaLabel: "Crear un presupuesto",
          ctaHref: "/budgets/new",
        },
        buffer: {
          text: "Tu colchón de emergencia es bajo. Apuntá a separar un monto fijo cada mes hasta cubrir 3 meses de gastos.",
          ctaLabel: "Ver tus cuentas",
          ctaHref: "/accounts",
        },
        trend: {
          text: "Varios de los últimos meses cerraron en rojo. Revisá la evolución mensual y dónde se va el dinero.",
          ctaLabel: "Ver reporte de evolución",
          ctaHref: "/reports",
        },
        budgets: {
          text: "Tenés presupuestos excedidos. Ajustá los límites o recortá el gasto en esas categorías.",
          ctaLabel: "Revisar presupuestos",
          ctaHref: "/budgets",
        },
      };
      const recommendation =
        RECOMMENDATION[weakest.key] ?? {
          text: "Seguí registrando tus movimientos para tener lecturas más precisas mes a mes.",
          ctaLabel: "Registrar un movimiento",
          ctaHref: "/transactions/new",
        };

      return {
        period: report.period,
        currencyCode,
        health: {
          score,
          band,
          headline: BAND_META[band].headline,
          reasons,
          components,
        },
        analytical,
        personalized,
        recommendation,
      };
    },
  };
}
