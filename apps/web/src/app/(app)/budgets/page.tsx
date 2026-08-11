import Link from "next/link";
import { budgetAlertRepository, budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createBudgetService } from "@/features/budgets/services/budget-service";
import { BudgetCard } from "@/features/budgets/components/budget-card";
import { notifyBudgetAlert } from "@/lib/notifications/notify-budget-alert";

const service = createBudgetService({
  budgets: budgetRepository,
  categories: categoryRepository,
  budgetQueries: createBudgetQueries(db),
  budgetAlerts: budgetAlertRepository,
  notifyBudgetAlert,
});

const ALERT_LABEL = { BUDGET_NEAR_LIMIT: "cerca del límite", BUDGET_EXCEEDED: "excedido" } as const;

export default async function BudgetsPage() {
  const user = await requireCurrentUser();
  const [overview, alerts] = await Promise.all([
    service.getBudgetOverview(user),
    service.getBudgetAlerts(user),
  ]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Presupuestos</p>
          <h1>Presupuestos</h1>
          <p className="lede">Definí límites de gasto mensuales por categoría y controlá cuánto consumiste.</p>
        </div>
        <Link className="primary-button" href="/budgets/new">Crear presupuesto</Link>
      </header>

      {alerts.length > 0 && (
        <div className="budget-alerts" role="status">
          {alerts.map((alert) => (
            <p className="budget-alert" key={alert.id}>
              Usaste el {alert.usagePercent}% de tu presupuesto de {alert.categoryName} ({ALERT_LABEL[alert.alertType]}).
            </p>
          ))}
        </div>
      )}

      {overview.length === 0 ? (
        <section className="accounts-empty" role="status">
          <h2>Todavía no configuraste presupuestos.</h2>
          <p>Creá límites mensuales para las categorías que quieras controlar.</p>
          <Link className="secondary-button" href="/budgets/new">Crear presupuesto</Link>
        </section>
      ) : (
        <section className="budget-list">
          {overview.map((item) => <BudgetCard item={item} key={item.budgetId} />)}
        </section>
      )}
    </>
  );
}
