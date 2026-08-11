import Link from "next/link";
import { notFound } from "next/navigation";

import { accountRepository, createActivityQueries, db } from "@know-finanzas/db";
import { MoneyAmount } from "@/components/financial/money-amount";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createAccountService } from "@/features/accounts/services/account-service";
import { AccountManagement } from "@/features/accounts/components/account-management";

const service = createAccountService({ accounts: accountRepository });
const activityQueries = createActivityQueries(db);

export default async function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const user = await requireCurrentUser();
  const { accountId } = await params;
  let account;
  try { account = await service.getAccountOverview(user.id, accountId); } catch { notFound(); }
  const activity = await activityQueries.listRecentActivity(user.id, { accountId, includeVoided: true, limit: 10 });

  return <><Link className="back-link" href="/accounts">← Volver a cuentas</Link><header className="detail-header"><div><p className="eyebrow">Detalle de cuenta</p><h1>{account.name}</h1><p className="lede">{account.type} · {account.currencyCode} · {account.status === "ACTIVE" ? "Activa" : "Archivada"}</p></div><p className="detail-balance"><MoneyAmount amount={account.balance} currency={account.currencyCode} /></p></header><section className="detail-grid"><article className="detail-card"><p className="card-label">Saldo actual</p><p className="detail-value"><MoneyAmount amount={account.balance} currency={account.currencyCode} /></p><p className="card-helper">Derivado del saldo inicial y movimientos posteados.</p></article><article className="detail-card"><p className="card-label">Punto de partida</p><p className="detail-value"><MoneyAmount amount={account.openingBalance} currency={account.currencyCode} /></p><p className="card-helper">Desde {account.openingDate} · El saldo inicial no es un ingreso.</p></article></section><AccountManagement accountId={account.id} name={account.name} archived={account.status === "ARCHIVED"} /><section className="transaction-list detail-empty" aria-label="Movimientos recientes"><p className="card-label">Movimientos recientes</p>{activity.length === 0 ? <><h2>Todavía no hay movimientos.</h2><p className="card-helper">Los ingresos y gastos de esta cuenta aparecerán acá.</p></> : activity.map((item) => <article className="transaction-row" key={item.id}><div><Link href={`/transactions/${item.id}`}><strong>{item.description}</strong></Link><p>{item.categoryName ?? "Sin categoría"} · {item.status === "VOIDED" ? "Anulado" : "Publicado"}</p></div><strong className={item.type === "EXPENSE" ? "expense-amount" : "income-amount"}>{item.type === "EXPENSE" ? "-" : "+"}{item.currencyCode} {item.amount}</strong></article>)}</section></>;
}
