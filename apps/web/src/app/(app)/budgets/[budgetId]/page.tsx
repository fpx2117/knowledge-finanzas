import Link from "next/link";
import { budgetAlertRepository, budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createBudgetService } from "@/features/budgets/services/budget-service";
import { MoneyAmount } from "@/components/financial/money-amount";
import { BudgetLimitForm } from "@/features/budgets/components/budget-limit-form";

const service = createBudgetService({
  budgets: budgetRepository,
  categories: categoryRepository,
  budgetQueries: createBudgetQueries(db),
  budgetAlerts: budgetAlertRepository,
});

const STATUS_LABEL = { NORMAL: "Dentro del presupuesto", NEAR_LIMIT: "Cerca del límite", EXCEEDED: "Presupuesto excedido" } as const;
const STATUS_CLASS = { NORMAL: "normal", NEAR_LIMIT: "near-limit", EXCEEDED: "exceeded" } as const;

export default async function BudgetDetailPage({ params }: { params: Promise<{ budgetId: string }> }) {
  const user = await requireCurrentUser();
  const { budgetId } = await params;
  const detail = await service.getBudgetDetail(user, budgetId);

  return (
    <>
      <Link className="back-link" href="/budgets">← Volver a presupuestos</Link>
      <header className="detail-header">
        <div>
          <p className="eyebrow">Detalle de presupuesto</p>
          <h1>{detail.categoryName}</h1>
          <p className="lede">
            <span className={`status-badge ${STATUS_CLASS[detail.status]}`}>{STATUS_LABEL[detail.status]}</span>
          </p>
        </div>
        <p className="detail-balance"><MoneyAmount amount={detail.spent} currency={detail.currencyCode} /> / <MoneyAmount amount={detail.limit} currency={detail.currencyCode} /></p>
      </header>

      <div className="detail-grid">
        <article className="detail-card">
          <p className="card-label">Límite mensual</p>
          <p className="detail-value"><MoneyAmount amount={detail.limit} currency={detail.currencyCode} /></p>
        </article>
        <article className="detail-card">
          <p className="card-label">Consumido</p>
          <p className="detail-value"><MoneyAmount amount={detail.spent} currency={detail.currencyCode} /></p>
        </article>
        <article className="detail-card">
          <p className="card-label">{detail.status === "EXCEEDED" ? "Por encima del límite" : "Disponible"}</p>
          <p className="detail-value"><MoneyAmount amount={detail.remaining} currency={detail.currencyCode} /></p>
        </article>
        <article className="detail-card">
          <p className="card-label">Uso del período</p>
          <p className="detail-value">{detail.usagePercent}%</p>
        </article>
      </div>

      <div className="management-card">
        <div>
          <p className="card-label">Gestionar presupuesto</p>
          <p className="status-note">Archivar deja de mostrarlo como activo, pero conserva su historial.</p>
        </div>
        <BudgetLimitForm budget={{ id: detail.budgetId, limitAmount: detail.limit, currencyCode: detail.currencyCode, name: detail.name, status: detail.budgetStatus }} />
      </div>

      <h2 className="payment-heading">Movimientos que aportan al presupuesto</h2>
      {detail.transactions.length === 0 ? (
        <p className="detail-empty">Todavía no hay movimientos este mes en esta categoría.</p>
      ) : (
        <section className="transaction-list">
          {detail.transactions.map((transaction) => (
            <article className="transaction-row" key={transaction.id}>
              <div>
                <strong>{transaction.description}</strong>
                <p>{formatDate(transaction.occurredAt)}{transaction.merchant ? ` · ${transaction.merchant}` : ""}</p>
              </div>
              <strong className={transaction.type === "REFUND" ? "income-amount" : "expense-amount"}>
                {transaction.type === "REFUND" ? "-" : "+"}<MoneyAmount amount={transaction.amount} currency={transaction.currencyCode} />
              </strong>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date(value));
}
