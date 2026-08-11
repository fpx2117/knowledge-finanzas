import Link from "next/link";
import { notFound } from "next/navigation";
import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { TransactionActions } from "@/features/transactions/components/transaction-actions";

export default async function TransactionDetailPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const user = await requireCurrentUser();
  const { transactionId } = await params;
  const transaction = await transactionRepository.findByIdForUser(transactionId, user.id);
  if (!transaction) notFound();
  const account = await accountRepository.findByIdForUser(transaction.accountId, user.id);
  const category = transaction.categoryId ? await categoryRepository.findByIdForUser(transaction.categoryId, user.id) : undefined;
  return <><Link className="back-link" href="/transactions">← Volver a movimientos</Link><header className="detail-header"><div><p className="eyebrow">Detalle de movimiento</p><h1>{transaction.description}</h1><p className="lede">{transaction.type === "EXPENSE" ? "Gasto" : "Ingreso"} · {transaction.status === "VOIDED" ? "Anulado" : "Publicado"}</p></div><p className={transaction.type === "EXPENSE" ? "detail-balance expense-amount" : "detail-balance income-amount"}>{transaction.type === "EXPENSE" ? "-" : "+"}{transaction.currencyCode} {transaction.amount}</p></header><section className="detail-grid"><article className="detail-card"><p className="card-label">Cuenta</p><p className="detail-value">{account?.name ?? "Cuenta"}</p><p className="card-helper">{transaction.currencyCode}</p></article><article className="detail-card"><p className="card-label">Categoría</p><p className="detail-value">{category?.name ?? "Sin categoría"}</p><p className="card-helper">{transaction.occurredAt.toLocaleDateString("es-AR")}</p></article></section><TransactionActions transactionId={transaction.id} voided={transaction.status === "VOIDED"} /></>;
}
