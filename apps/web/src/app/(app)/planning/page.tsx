import Link from "next/link";
import { createUpcomingObligationQueries, db } from "@know-finanzas/db";
import { createRecurringTransactionRepository } from "@know-finanzas/db/repositories";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { todayInTimezone } from "@know-finanzas/finance";
import { PlanningAction } from "@/features/planning/components/planning-action";
import { RecurringActions } from "@/features/planning/components/recurring-actions";

function addDays(date: string, days: number) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }

export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireCurrentUser();
  const tab = (await searchParams).tab ?? "upcoming";
  const today = todayInTimezone(new Date(), user.timezone);
  const through = addDays(today, 30);
  const queries = createUpcomingObligationQueries(db);
  const [debtRows, scheduled, recurring] = await Promise.all([
    queries.listDebtInstallmentsForUser(user.id, { from: today, to: through }),
    queries.listScheduledForUser(user.id, { from: today, to: through }),
    createRecurringTransactionRepository(db).listForUser(user.id),
  ]);
  const upcoming = [...debtRows.map((row) => ({ id: row.installment.id, title: row.debt.name, date: row.installment.dueDate, amount: row.installment.totalAmount, source: "Deuda · Comprometido", direction: "OUTFLOW" as const })), ...scheduled.map((row) => ({ id: row.id, title: row.description, date: row.scheduledDate, amount: row.expectedAmount, source: row.source === "RECURRING" ? "Programado · Recurrente" : "Programado · Esperado", direction: row.type === "INCOME" ? "INFLOW" as const : "OUTFLOW" as const }))].sort((a, b) => a.date.localeCompare(b.date));
  return <><header className="page-header"><div><p className="eyebrow">Planificación</p><h1>Lo que viene.</h1><p className="lede">Separá tus expectativas futuras de los movimientos que ya ocurrieron.</p></div><Link className="primary-button" href="/transactions/new?type=EXPENSE">Programar movimiento</Link></header><nav className="planning-tabs" aria-label="Secciones de planificación"><Link className={tab === "upcoming" ? "planning-tab active" : "planning-tab"} href="/planning?tab=upcoming">Próximos</Link><Link className={tab === "scheduled" ? "planning-tab active" : "planning-tab"} href="/planning?tab=scheduled">Programados</Link><Link className={tab === "recurring" ? "planning-tab active" : "planning-tab"} href="/planning?tab=recurring">Recurrentes</Link></nav>{tab === "recurring" ? <section className="transaction-list">{recurring.length === 0 ? <p className="planning-empty">No hay reglas recurrentes.</p> : recurring.map((item) => <article className="transaction-row" key={item.id}><div><strong>{item.description}</strong><p>{item.frequency} · {item.status} · próxima {item.nextOccurrence ?? "sin fecha"}</p></div><RecurringActions id={item.id} status={item.status} /></article>)}</section> : tab === "scheduled" ? <section className="transaction-list">{scheduled.length === 0 ? <p className="planning-empty">No hay movimientos programados.</p> : scheduled.map((item) => <article className="transaction-row" key={item.id}><div><strong>{item.description}</strong><p>{item.scheduledDate} · {item.type === "EXPENSE" ? "Gasto" : "Ingreso"} · {item.source === "RECURRING" ? "Recurrente" : "Manual"}</p></div><PlanningAction scheduledId={item.id} accountId={item.accountId} type={item.type} description={item.description} amount={item.expectedAmount} date={item.scheduledDate} /></article>)}</section> : <section className="planning-groups" aria-label="Próximos eventos">{upcoming.length === 0 ? <section className="accounts-empty" role="status"><h2>No hay próximos eventos.</h2><p>Las cuotas y movimientos programados van a aparecer acá.</p></section> : upcoming.map((item) => <article className="upcoming-row" key={`${item.source}-${item.id}`}><div><span className="status-badge">{item.source}</span><h2>{item.title}</h2><p>{item.date} · {item.direction === "OUTFLOW" ? "Salida" : "Entrada"}</p></div><strong>{item.direction === "OUTFLOW" ? "-" : "+"}ARS {item.amount}</strong></article>)}</section>}</>;
}
