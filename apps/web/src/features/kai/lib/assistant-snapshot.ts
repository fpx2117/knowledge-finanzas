import {
  createAccountBalanceQueries,
  createActivityQueries,
  createDebtSummaryQueries,
  createMonthlySummaryQueries,
  createUpcomingObligationQueries,
  db,
} from "@know-finanzas/db";
import { Money } from "@know-finanzas/finance";

import { createDashboardService } from "@/features/dashboard/services/dashboard-service";
import { createReportService } from "@/features/reports/services/report-service";
import { getBlueQuote } from "@/features/fx/services/fx-service";

const dashboardService = createDashboardService({
  balances: createAccountBalanceQueries(db),
  monthly: createMonthlySummaryQueries(db),
  activity: createActivityQueries(db),
  debts: createDebtSummaryQueries(db),
  scheduled: createUpcomingObligationQueries(db),
});
const reportService = createReportService(db);

/**
 * The read-only picture of the user's finances handed to KAI's LLM fallback (spec §18
 * "minimumRequiredContext"). Deliberately small and already-computed — the model only reads it,
 * never recomputes. Amounts stay in their own currency (never summed across currencies).
 *
 * WP-KAI-LLM-MIN-CONTEXT: the spec's own example for this WP was "¿por qué subieron mis
 * gastos?" needing `categoryVariations` — this snapshot didn't have per-category data at all
 * until now, so a question like that got answered with no real basis. `categorias` below reuses
 * `report.expenseByCategory[].delta`, the exact same MoM-per-category comparison
 * `INS-SPEND-DELTA` already computes (`features/insights/detectors.ts`) — no new query. Building
 * separate minimal-context variants per question *type* on top of an already-small snapshot
 * would have shaved little for real design cost; this fixes the actual gap the WP called out.
 *
 * WP-KAI-CLEANUP-ASSISTANT: moved here from the old `features/assistant/` (the pre-KAI floating
 * assistant) — this was the only file in that folder still used; the rest of it (and the dead
 * `runAssistantChat`/`sendAssistantMessageAction` it fed) is gone.
 */
export async function buildAssistantSnapshot(userId: string, timezone: string, baseCurrency: string, now: Date = new Date()) {
  const [summary, blue, report] = await Promise.all([
    dashboardService.getDashboardSummary({ userId, timezone, now }),
    getBlueQuote(now).catch(() => null),
    reportService.getReport({ userId, timezone, baseCurrency, now }).catch(() => null),
  ]);

  const disponiblePorMoneda = new Map(
    summary.projections.map((p) => [p.currencyCode, p.spendable.spendable.toString()]),
  );

  return {
    hoy: summary.today,
    cuentas: summary.accounts.length,
    saldos: summary.liquidBalances.map((b) => ({
      moneda: b.currencyCode,
      saldoTotal: b.total,
      disponible30Dias: disponiblePorMoneda.get(b.currencyCode) ?? b.total,
    })),
    mesActual: summary.monthly.map((m) => ({
      moneda: m.currencyCode,
      ingresos: m.income,
      gastos: m.expense,
      resultado: Money.fromString(m.income, m.currencyCode).subtract(Money.fromString(m.expense, m.currencyCode)).toString(),
    })),
    deudaPendiente: summary.debt.map((d) => ({ moneda: d.currencyCode, total: d.remaining })),
    obligacionesProximas: summary.upcomingObligations.slice(0, 12).map((o) => ({
      titulo: o.title,
      vence: o.dueDate,
      monto: o.amount,
      moneda: o.currencyCode,
      vencida: o.isOverdue,
    })),
    dolarBlue: blue
      ? { compra: blue.bid, venta: blue.ask, actualizado: blue.asOf, estimadoDesactualizado: blue.stale }
      : null,
    // Top categories this month, in `report.currencyCode`, with the MoM delta when there's a
    // prior month to compare against — this is what lets KAI actually answer "¿por qué subió
    // mi gasto?" instead of guessing.
    categorias: report
      ? report.expenseByCategory.slice(0, 8).map((c) => ({
          nombre: c.name,
          monto: c.amount,
          variacionVsMesAnterior: c.delta ? { monto: c.delta.value, porcentaje: c.delta.pct } : null,
        }))
      : [],
  };
}
