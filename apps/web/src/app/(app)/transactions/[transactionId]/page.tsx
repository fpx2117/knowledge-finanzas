import Link from "next/link";
import { notFound } from "next/navigation";
import { resourceIdOr404 } from "@/lib/http/resource-id";

import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusChip } from "@/components/shared/status-chip";
import { TypeBadge } from "@/components/financial/type-badge";
import { MoneyAmount } from "@/components/financial/money-amount";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate } from "@/lib/format";
import { TransactionActions } from "@/features/transactions/components/transaction-actions";
import { explainClassification } from "@/features/transactions/lib/explain-classification";
import { toEditableAmount } from "@/features/capture/lib/amount-text";

export default async function TransactionDetailPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId: transactionIdParam } = await params;
  const transactionId = resourceIdOr404(transactionIdParam);
  const user = await requireCurrentUser();

  const transaction = await transactionRepository.findByIdForUser(transactionId, user.id);
  if (!transaction) notFound();

  const editableType: "INCOME" | "EXPENSE" | null =
    transaction.type === "INCOME" || transaction.type === "EXPENSE" ? transaction.type : null;
  const [account, category, categoryOptions] = await Promise.all([
    accountRepository.findByIdForUser(transaction.accountId, user.id),
    transaction.categoryId ? categoryRepository.findByIdForUser(transaction.categoryId, user.id) : Promise.resolve(undefined),
    editableType ? categoryRepository.listForUser(user.id, { type: editableType }) : Promise.resolve([]),
  ]);

  const negative = transaction.type === "EXPENSE" || transaction.type === "LIABILITY_PAYMENT";
  const categoryExplanation = explainClassification(transaction.classification, { categoryName: category?.name });
  const repeatPrefill = editableType
    ? {
        type: editableType,
        amount: toEditableAmount(transaction.amount),
        description: transaction.description,
        merchant: transaction.merchant ?? null,
        categoryId: transaction.categoryId ?? null,
        accountId: transaction.accountId,
      }
    : null;
  const editable = editableType
    ? {
        type: editableType,
        description: transaction.description,
        merchant: transaction.merchant ?? "",
        categoryId: transaction.categoryId ?? "",
        notes: transaction.notes ?? "",
        categoryOptions: categoryOptions.map((c) => ({ id: c.id, name: c.name })),
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={transaction.description}
        description={formatLongDate(transaction.occurredAt)}
        actions={
          transaction.status === "POSTED" ? (
            <TransactionActions transactionId={transaction.id} repeatPrefill={repeatPrefill} editable={editable} />
          ) : undefined
        }
      />

      <SectionCard title="Detalle del movimiento">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Row label="Monto">
            <MoneyAmount
              amount={negative && !transaction.amount.startsWith("-") ? `-${transaction.amount}` : transaction.amount}
              currency={transaction.currencyCode}
              tone={negative ? "negative" : "positive"}
              className="text-metric font-medium"
            />
          </Row>
          <Row label="Tipo">
            <TypeBadge type={transaction.type} />
          </Row>
          <Row label="Cuenta">
            {account ? (
              <Link href={`/accounts/${account.id}`} className="text-small font-medium text-brand hover:underline">
                {account.name}
              </Link>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Categoría" full={Boolean(categoryExplanation)}>
            <span className="text-small text-foreground">{category?.name ?? "Sin categoría"}</span>
            {categoryExplanation ? (
              <details className="mt-1.5 text-caption text-muted-foreground [&_summary]:cursor-pointer [&_summary]:select-none [&_summary]:text-brand [&_summary]:hover:underline">
                <summary>¿Por qué esta categoría?</summary>
                <p className="mt-1.5 text-small text-foreground-secondary">{categoryExplanation.headline}</p>
                {categoryExplanation.reasons.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {categoryExplanation.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : null}
              </details>
            ) : null}
          </Row>
          {transaction.merchant ? (
            <Row label="Comercio">
              <span className="text-small text-foreground">{transaction.merchant}</span>
            </Row>
          ) : null}
          <Row label="Estado">
            <StatusChip tone={transaction.status === "POSTED" ? "positive" : "neutral"}>
              {transaction.status === "POSTED" ? "Registrada" : "Anulada"}
            </StatusChip>
          </Row>
          {transaction.notes ? (
            <Row label="Notas" full>
              <span className="text-small text-foreground-secondary">{transaction.notes}</span>
            </Row>
          ) : null}
        </dl>
      </SectionCard>
    </div>
  );
}

function Row({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
