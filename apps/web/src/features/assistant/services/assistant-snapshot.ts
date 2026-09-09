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
import { getBlueQuote } from "@/features/fx/services/fx-service";

const dashboardService = createDashboardService({
  balances: createAccountBalanceQueries(db),
  monthly: createMonthlySummaryQueries(db),
  activity: createActivityQueries(db),
  debts: createDebtSummaryQueries(db),
  scheduled: createUpcomingObligationQueries(db),
});

/**
 * The read-only picture of the user's finances handed to the assistant. Deliberately small and
 * already-computed — the model only reads it, never recomputes. Amounts stay in their own
 * currency (never summed across currencies).
 */
export async function buildAssistantSnapshot(userId: string, timezone: string, now: Date = new Date()) {
  const [summary, blue] = await Promise.all([
    dashboardService.getDashboardSummary({ userId, timezone, now }),
    getBlueQuote(now).catch(() => null),
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
  };
}
