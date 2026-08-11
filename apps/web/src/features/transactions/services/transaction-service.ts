import { calculateRemainingRefundable, getCurrencyMetadata, Money, todayInTimezone } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "../../../lib/billing/product-access-gate";

type Account = { id: string; userId: string; currencyCode: string; openingDate: string; status: "ACTIVE" | "ARCHIVED" };
type Category = { id: string; userId: string; type: "INCOME" | "EXPENSE"; status: "ACTIVE" | "ARCHIVED" };

type Dependencies = {
  accounts: { findByIdForUser(id: string, userId: string): Promise<Account | undefined> };
  categories: { findByIdForUser(id: string, userId: string): Promise<Category | undefined> };
  transactions: { create(input: Record<string, unknown>): Promise<unknown>; createRefundAtomic?(input: Record<string, unknown>): Promise<unknown>; findByIdForUser(id: string, userId: string): Promise<{ id: string; userId: string; accountId: string; status: "POSTED" | "VOIDED"; type: "INCOME" | "EXPENSE" | "REFUND" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "TRANSFER_IN" | "TRANSFER_OUT" | "LIABILITY_PAYMENT"; amount: string; currencyCode: string; categoryId: string | null } | undefined>; sumPostedRefundsForOriginal?(id: string, userId: string): Promise<string>; voidForUser(id: string, userId: string, at: Date): Promise<unknown>; updateMetadataForUser(id: string, userId: string, input: { description: string; merchant: string | null; categoryId: string | null; notes: string | null }): Promise<unknown> };
  now?: () => Date;
  gate?: ProductAccessGate;
};

export function createTransactionService({ accounts, categories, transactions, now = () => new Date(), gate = allowAllProductAccessGate }: Dependencies) {
  return {
    createIncomeTransaction: (userId: string, input: TransactionInput, timezone: string) => create(userId, "INCOME", input, timezone),
    createExpenseTransaction: (userId: string, input: TransactionInput & { merchant?: string }, timezone: string) => create(userId, "EXPENSE", input, timezone),
    async voidTransaction(userId: string, transactionId: string) {
      const transaction = await transactions.findByIdForUser(transactionId, userId);
      if (!transaction) throw new ApplicationError("TRANSACTION_NOT_FOUND");
      if (transaction.status === "VOIDED") throw new ApplicationError("TRANSACTION_ALREADY_VOIDED");
      return transactions.voidForUser(transactionId, userId, now());
    },
    async updateTransactionMetadata(userId: string, input: { transactionId: string; description: string; merchant?: string; categoryId?: string; notes?: string }) {
      await gate.assertCanWrite(userId);
      const transaction = await transactions.findByIdForUser(input.transactionId, userId);
      if (!transaction) throw new ApplicationError("TRANSACTION_NOT_FOUND");
      if (transaction.status === "VOIDED") throw new ApplicationError("TRANSACTION_ALREADY_VOIDED");
      let categoryId: string | null = null;
      if (input.categoryId) {
        const category = await categories.findByIdForUser(input.categoryId, userId);
        if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND");
        if (category.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED");
        if (category.type !== transaction.type) throw new ApplicationError("CATEGORY_TYPE_MISMATCH");
        categoryId = category.id;
      }
      return transactions.updateMetadataForUser(input.transactionId, userId, { description: input.description.trim(), merchant: input.merchant?.trim() || null, categoryId, notes: input.notes?.trim() || null });
    },
    async createRefund(userId: string, input: { accountId: string; originalTransactionId: string; amount: string; occurredAt: string; notes?: string }, timezone: string) {
      const account = await accounts.findByIdForUser(input.accountId, userId);
      if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND");
      if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED");
      const original = await transactions.findByIdForUser(input.originalTransactionId, userId);
      if (!original || original.type !== "EXPENSE" || original.status !== "POSTED") throw new ApplicationError("INVALID_INPUT", { field: "originalTransactionId" });
      if (original.accountId !== account.id || original.currencyCode !== account.currencyCode) throw new ApplicationError("INVALID_INPUT", { field: "accountId" });
      const occurredAt = new Date(input.occurredAt);
      if (occurredAt > now() || todayInTimezone(occurredAt, timezone) < account.openingDate) throw new ApplicationError("INVALID_INPUT", { field: "occurredAt" });
      const refunds = transactions.sumPostedRefundsForOriginal ? await transactions.sumPostedRefundsForOriginal(original.id, userId) : "0";
      let amount: string;
      try { amount = Money.fromPositiveString(input.amount, account.currencyCode).toString(); } catch (error) { throw new ApplicationError("INVALID_AMOUNT", { field: "amount", cause: error }); }
      if (calculateRemainingRefundable(original.amount, [refunds], account.currencyCode).compareTo(Money.fromString(amount, account.currencyCode)) < 0) throw new ApplicationError("INVALID_AMOUNT", { field: "amount" });
      const refundInput = { userId, accountId: account.id, categoryId: original.categoryId, originalTransactionId: original.id, relatedTransactionId: null, reason: null, type: "REFUND" as const, amount, currencyCode: account.currencyCode, description: "Reembolso", merchant: null, occurredAt, postedAt: now(), source: "MANUAL" as const, notes: input.notes?.trim() || null };
      const created = transactions.createRefundAtomic ? await transactions.createRefundAtomic(refundInput) : await transactions.create(refundInput);
      if (!created) throw new ApplicationError("INVALID_AMOUNT", { field: "amount" });
      return created;
    },
    async createAdjustment(userId: string, input: { accountId: string; type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"; amount: string; reason: string; occurredAt: string; relatedTransactionId?: string; notes?: string }, timezone: string) {
      const account = await accounts.findByIdForUser(input.accountId, userId);
      if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND");
      if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED");
      if (!input.reason.trim()) throw new ApplicationError("INVALID_INPUT", { field: "reason" });
      const occurredAt = new Date(input.occurredAt);
      if (occurredAt > now() || todayInTimezone(occurredAt, timezone) < account.openingDate) throw new ApplicationError("INVALID_INPUT", { field: "occurredAt" });
      let amount: string;
      try { amount = Money.fromPositiveString(input.amount, account.currencyCode).toString(); } catch (error) { throw new ApplicationError("INVALID_AMOUNT", { field: "amount", cause: error }); }
      return transactions.create({ userId, accountId: account.id, categoryId: null, originalTransactionId: null, relatedTransactionId: input.relatedTransactionId ?? null, reason: input.reason.trim(), type: input.type, amount, currencyCode: account.currencyCode, description: input.reason.trim(), merchant: null, occurredAt, postedAt: now(), source: "MANUAL", notes: input.notes?.trim() || null });
    },
  };

  async function create(userId: string, type: "INCOME" | "EXPENSE", input: TransactionInput & { merchant?: string }, timezone: string) {
    await gate.assertCanWrite(userId);
    const account = await accounts.findByIdForUser(input.accountId, userId);
    if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND", { field: "accountId" });
    if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED", { field: "accountId" });

    const occurredAt = new Date(input.occurredAt);
    const current = now();
    if (Number.isNaN(occurredAt.getTime()) || occurredAt > current || todayInTimezone(occurredAt, timezone) < account.openingDate) {
      throw new ApplicationError("INVALID_INPUT", { field: "occurredAt" });
    }

    const metadata = getCurrencyMetadata(account.currencyCode);
    const fractionalDigits = input.amount.split(".")[1]?.length ?? 0;
    if (fractionalDigits > metadata.decimalPlaces) throw new ApplicationError("INVALID_AMOUNT", { field: "amount" });
    let amount: string;
    try { amount = Money.fromPositiveString(input.amount, account.currencyCode).toString(); } catch (error) { throw new ApplicationError("INVALID_AMOUNT", { field: "amount", cause: error }); }

    let categoryId: string | null = null;
    if (input.categoryId) {
      const category = await categories.findByIdForUser(input.categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND", { field: "categoryId" });
      if (category.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED", { field: "categoryId" });
      if (category.type !== type) throw new ApplicationError("CATEGORY_TYPE_MISMATCH", { field: "categoryId" });
      categoryId = category.id;
    }

    return transactions.create({
      userId, accountId: account.id, categoryId, type, amount,
      currencyCode: account.currencyCode, description: input.description.trim(),
      merchant: type === "EXPENSE" ? input.merchant?.trim() || null : null,
      occurredAt, postedAt: current, source: "MANUAL", notes: input.notes?.trim() || null,
    });
  }
}

type TransactionInput = { accountId: string; amount: string; description: string; categoryId?: string; occurredAt: string; notes?: string };
