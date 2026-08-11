import Link from "next/link";
import { budgetRepository, categoryRepository, createAccountBalanceQueries, createActivityQueries, createBudgetQueries, createDebtSummaryQueries, createMonthlySummaryQueries, createUpcomingObligationQueries, createUserRepository, db, transactionRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { MoneyAmount } from "@/components/financial/money-amount";
import { createDashboardService } from "@/features/dashboard/services/dashboard-service";
import { createBudgetService, type BudgetOverviewItem } from "@/features/budgets/services/budget-service";
import { CashflowExplainer } from "@/features/insights/components/cashflow-explainer";
import { evaluateFinancialAlerts } from "@/lib/notifications/evaluate-financial-alerts.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { checkAndEmitActivation } from "@/lib/analytics/check-and-emit-activation";
import { statisticalProfileRepository } from "@/lib/privacy/statistical-profile.instance";
import { StatisticalProfilePrompt } from "@/features/privacy/components/statistical-profile-prompt";

const service = createDashboardService({
  balances: createAccountBalanceQueries(db),
  monthly: createMonthlySummaryQueries(db),
  activity: createActivityQueries(db),
  projections: { debts: createDebtSummaryQueries(db), scheduled: createUpcomingObligationQueries(db) },
});

const budgetService = createBudgetService({ budgets: budgetRepository, categories: categoryRepository, budgetQueries: createBudgetQueries(db) });
const users = createUserRepository(db);

// Default recommendation from the source doc: after the first 5-10 transactions, not at signup.
const STATISTICAL_PROFILE_PROMPT_TRANSACTION_THRESHOLD = 5;

const BUDGET_STATUS_LABEL = { NORMAL: "Dentro del presupuesto", NEAR_LIMIT: "Cerca del límite", EXCEEDED: "Excedido" } as const;

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const now = new Date();
  const [summary, budgets] = await Promise.all([
    service.getDashboardSummary({ userId: user.id, timezone: user.timezone, now }),
    budgetService.getBudgetOverview(user),
  ]);

  // Best-effort, never blocks the page: a notification-evaluation failure must not prevent the
  // user from seeing their own financial data (docs/09-notifications-alerts.md domain rule).
  try {
    const access = await users.findAccessInputById(user.id);
    await evaluateFinancialAlerts({ userId: user.id, userTimezone: user.timezone, now, trialEndsAt: access?.trialEndsAt ?? null });
  } catch {
    // swallow: notifications are derived information, never a dashboard-blocking dependency.
  }

  // Same failure-isolation rule applies to analytics (Financial Invariant: "analytics failures
  // never propagate as errors to the calling operation") — dashboard_viewed/cashflow_viewed are
  // fired server-side here because this app has no client analytics script loaded yet, and
  // they're also what makes activation:v1's "dashboard/cashflow viewed" condition measurable.
  try {
    const internal = isInternalAccount(user.email);
    await analyticsService("dashboard_viewed", {}, { userId: user.id, internal });
    if (summary.projections.length > 0) {
      await analyticsService("cashflow_viewed", {}, { userId: user.id, internal });
    }
    await checkAndEmitActivation(user.id);
  } catch {
    // swallow: analytics is never allowed to affect the dashboard render.
  }

  const showStatisticalProfilePrompt = await shouldShowStatisticalProfilePrompt(user.id);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Resumen financiero</p>
          <h1>Tu dinero, sin ruido.</h1>
          <p className="lede">Una lectura honesta de lo que tenés, lo que debés y lo que puede pasar en los próximos 30 días.</p>
        </div>
        <Link className="primary-button" href="/transactions/new?type=EXPENSE">Registrar gasto</Link>
      </header>

      {showStatisticalProfilePrompt && <StatisticalProfilePrompt />}

      {summary.accounts.length === 0 ? <EmptyDashboard /> : <DashboardContent summary={summary} budgets={budgets} />}
    </>
  );
}

async function shouldShowStatisticalProfilePrompt(userId: string): Promise<boolean> {
  try {
    const profile = await statisticalProfileRepository.findForUser(userId);
    if (profile?.promptDismissedAt) return false;

    const transactions = await transactionRepository.listForUser(userId, { limit: STATISTICAL_PROFILE_PROMPT_TRANSACTION_THRESHOLD });
    return transactions.length >= STATISTICAL_PROFILE_PROMPT_TRANSACTION_THRESHOLD;
  } catch {
    return false;
  }
}

function EmptyDashboard() {
  return <section className="accounts-empty" role="status"><h2>Empezá creando tu primera cuenta.</h2><p>Cuando registres una cuenta, vas a poder ver tu posición real y sus proyecciones acá.</p><Link className="secondary-button" href="/accounts/new">Crear cuenta</Link></section>;
}

function DashboardContent({ summary, budgets }: { summary: Awaited<ReturnType<typeof service.getDashboardSummary>>; budgets: BudgetOverviewItem[] }) {
  return <div className="dashboard-v1">
    <section className="dashboard-spendable" aria-labelledby="spendable-title">
      <div><p className="card-label" id="spendable-title">Disponible estimado</p><p className="dashboard-hero-copy">Después de compromisos de los próximos 30 días</p></div>
      <div className="dashboard-projection-values">{summary.projections.length === 0 ? <p className="metric-value">Sin proyección</p> : summary.projections.map((item) => <div key={item.currencyCode}><strong><MoneyAmount amount={item.spendable.spendable.toString()} currency={item.currencyCode} /></strong><p className="card-helper"><MoneyAmount amount={item.spendable.liquidBalance.toString()} currency={item.currencyCode} /> de saldo · <MoneyAmount amount={item.spendable.committedObligations.toString()} currency={item.currencyCode} /> comprometido</p></div>)}</div>
      <p className="explainability-note">El disponible no incluye ingresos futuros. Es una estimación, no un saldo contable.</p>
    </section>

    <section className="dashboard-section" aria-labelledby="monthly-title"><SectionHeading id="monthly-title" eyebrow="Este mes" title="El pulso del mes" /><div className="metric-grid dashboard-metrics"><MetricList title="Ingresos" helper="Entradas registradas" items={summary.monthly.map((item) => ({ currencyCode: item.currencyCode, amount: item.income }))} tone="income" /><MetricList title="Gastos" helper="Consumo neto registrado" items={summary.monthly.map((item) => ({ currencyCode: item.currencyCode, amount: item.expense }))} tone="expense" /></div></section>

    <section className="dashboard-section" aria-labelledby="position-title"><SectionHeading id="position-title" eyebrow="Tu posición" title="Lo que importa hoy" /><div className="dashboard-signal-grid"><SignalCard title="Saldo líquido" helper="Dinero real en cuentas" items={summary.liquidBalances.map((item) => ({ currencyCode: item.currencyCode, amount: item.total }))} /><SignalCard title="Deuda pendiente" helper="Cuotas no pagadas" items={summary.debt.map((item) => ({ currencyCode: item.currencyCode, amount: item.remaining }))} empty="Sin deuda pendiente" /><SignalCard title="Próximos compromisos" helper="Incluidos en el disponible" items={summary.projections.map((item) => ({ currencyCode: item.currencyCode, amount: item.spendable.committedObligations.toString() }))} empty="Sin compromisos" /></div></section>

    <section className="dashboard-section" aria-labelledby="cashflow-title"><SectionHeading id="cashflow-title" eyebrow="Proyección · próximos 30 días" title="¿Vas a llegar bien?" />{summary.projections.length === 0 ? <div className="dashboard-empty-note">Todavía no hay cuentas o eventos para proyectar.</div> : <div className="cashflow-list">{summary.projections.map((item) => <CashflowCard key={item.currencyCode} item={item} />)}</div>}</section>

    <section className="dashboard-section" aria-labelledby="activity-title"><SectionHeading id="activity-title" eyebrow="Actual" title="Movimientos recientes" /><div className="transaction-list dashboard-activity-list">{summary.recentActivity.length === 0 ? <p className="dashboard-empty-note">Todavía no hay movimientos registrados.</p> : summary.recentActivity.map((activity) => <ActivityRow key={String(activity.id)} activity={activity} />)}</div></section>

    {budgets.length > 0 && <section className="dashboard-section" aria-labelledby="budgets-title"><SectionHeading id="budgets-title" eyebrow="Secundario" title="Presupuestos" /><div className="dashboard-budget-list">{budgets.slice(0, 3).map((item) => <div className="dashboard-budget-row" key={item.budgetId}><span>{item.categoryName}</span><span>{item.usagePercent}% · {BUDGET_STATUS_LABEL[item.status]}</span></div>)}</div><Link className="account-link" href="/budgets">Ver presupuestos <span aria-hidden="true">→</span></Link></section>}
  </div>;
}

function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) { return <div className="dashboard-section-heading"><div><p className="card-label">{eyebrow}</p><h2 id={id}>{title}</h2></div></div>; }

function MetricList({ title, helper, items, tone }: { title: string; helper: string; items: Array<{ currencyCode: string; amount: string }>; tone: "income" | "expense" }) { return <article className="metric-card"><p className="card-label">{title}</p>{items.length === 0 ? <p className="metric-value">Sin movimientos</p> : items.map((item) => <p className={`metric-value ${tone}-amount`} key={item.currencyCode}><MoneyAmount amount={item.amount} currency={item.currencyCode} /></p>)}<p className="card-helper">{helper}</p></article>; }

function SignalCard({ title, helper, items, empty = "Sin datos" }: { title: string; helper: string; items: Array<{ currencyCode: string; amount: string }>; empty?: string }) { return <article className="dashboard-signal-card"><p className="card-label">{title}</p>{items.length === 0 ? <p className="metric-value">{empty}</p> : items.map((item) => <p className="metric-value" key={item.currencyCode}><MoneyAmount amount={item.amount} currency={item.currencyCode} /></p>)}<p className="card-helper">{helper}</p></article>; }

function CashflowCard({ item }: { item: Awaited<ReturnType<typeof service.getDashboardSummary>>["projections"][number] }) { const cashflow = item.cashflow; return <article className="cashflow-card"><div className="cashflow-card-header"><div><p className="card-label">{item.currencyCode} · proyectado</p><h3>Saldo al final del período</h3></div><strong><MoneyAmount amount={cashflow.projectedEndBalance.toString()} currency={item.currencyCode} /></strong></div><div className="cashflow-facts"><div><span>Mínimo proyectado</span><strong><MoneyAmount amount={cashflow.minimumProjectedBalance.toString()} currency={item.currencyCode} /></strong><small>{cashflow.minimumBalanceDate}</small></div><div><span>Comprometido</span><strong><MoneyAmount amount={item.spendable.committedObligations.toString()} currency={item.currencyCode} /></strong><small>Obligaciones incluidas</small></div><div><span>Riesgo de faltante</span><strong>{cashflow.shortfallAmount ? <MoneyAmount amount={cashflow.shortfallAmount.toString()} currency={item.currencyCode} /> : "No detectado"}</strong><small>{cashflow.firstNegativeDate ? `Desde ${cashflow.firstNegativeDate}` : "Durante el horizonte"}</small></div></div><CashflowExplainer /></article>; }

function ActivityRow({ activity }: { activity: Record<string, unknown> }) { const isIncome = activity.type === "INCOME" || activity.type === "REFUND"; return <div className="transaction-row"><div><strong>{String(activity.description ?? activity.merchant ?? "Movimiento")}</strong><p>{String(activity.accountName ?? "Cuenta")} · {formatDate(activity.occurredAt)}</p></div><strong className={isIncome ? "income-amount" : "expense-amount"}>{isIncome ? "+" : "-"}<MoneyAmount amount={String(activity.amount)} currency={String(activity.currencyCode)} /></strong></div>; }

function formatDate(value: unknown) { if (!(value instanceof Date) && typeof value !== "string") return ""; return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date(value)); }
