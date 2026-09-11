"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  accountRepository,
  categoryMapRepository,
  categoryRepository,
  classificationRuleRepository,
  merchantRepository,
  merchantUserDefaultRepository,
  transactionRepository,
} from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { getTodayInTimezone, resolveOccurredAtISO } from "@/lib/date";
import { createTransactionService } from "@/features/transactions/services/transaction-service";
import { createGoalService } from "@/features/goals/services/goal-service";
import { createDebtPaymentService } from "@/features/debts/services/debt-payment-service";
import { createTransferService } from "@/features/transfers/services/transfer-service";
import {
  createExpenseTransactionSchema,
  createIncomeTransactionSchema,
} from "@/features/transactions/schemas/transaction-schemas";

const service = createTransactionService({
  accounts: accountRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  merchants: merchantRepository,
  categoryMap: categoryMapRepository,
  merchantDefaults: merchantUserDefaultRepository,
  classificationRules: classificationRuleRepository,
});

const inputSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z.string().trim().min(1),
  description: z.string().trim().min(1).max(240),
  merchant: z.string().trim().max(160).optional(),
  currencyHint: z.literal("USD").optional(),
});

export type KaiCreateResult =
  | { ok: true; transactionId: string; type: "EXPENSE" | "INCOME"; amount: string; currencyCode: string }
  | { ok: false; error: { code: string; message: string } };

const ACCOUNT_PRIORITY: Record<string, number> = { BANK: 0, DIGITAL_WALLET: 1, CASH: 2, SAVINGS: 3 };

/**
 * Creates a transaction from a KAI confirmation card. KAI only reaches here after the user
 * tapped "Confirmar" on a card that already showed exactly what would be written; the toast
 * offers an immediate undo. The account is picked automatically (see below) — "Editar" opens
 * the full Quick Add form for anything more specific.
 */
export async function kaiCreateTransactionAction(input: z.input<typeof inputSchema>): Promise<KaiCreateResult> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "No pude interpretar los datos del movimiento." } };
  }
  const { type, amount, description, merchant, currencyHint } = parsed.data;

  const accounts = await accountRepository.listForUser(user.id);
  if (accounts.length === 0) {
    return { ok: false, error: { code: "NO_ACCOUNT", message: "Primero necesitás crear una cuenta." } };
  }
  const wantCurrency = currencyHint ?? user.baseCurrency;
  const preferred = accounts.filter((a) => a.currencyCode === wantCurrency);
  const pool = preferred.length > 0 ? preferred : accounts;
  const account = [...pool].sort(
    (a, b) => (ACCOUNT_PRIORITY[a.type] ?? 9) - (ACCOUNT_PRIORITY[b.type] ?? 9),
  )[0];

  const occurredAt = resolveOccurredAtISO(getTodayInTimezone(user.timezone), user.timezone);
  const raw = {
    accountId: account.id,
    amount,
    description,
    occurredAt,
    commandId: randomUUID(),
    ...(type === "EXPENSE" && merchant ? { merchant } : {}),
  };

  try {
    // No duplicate gate here: the confirmation card the user just approved already shows
    // exactly what will be written, and the toast offers an immediate undo. The Quick Add
    // fuzzy-duplicate heuristic is tuned for a user-picked account and fires on coincidental
    // same-amount/same-day matches when KAI picks the account itself.
    const created =
      type === "INCOME"
        ? await service.createIncomeTransaction(user.id, createIncomeTransactionSchema.parse(raw), user.timezone)
        : await service.createExpenseTransaction(user.id, createExpenseTransactionSchema.parse(raw), user.timezone);
    const row = created as { id: string; amount: string; currencyCode: string };
    return { ok: true, transactionId: row.id, type, amount: row.amount, currencyCode: row.currencyCode };
  } catch (error) {
    const mapped = mapErrorToUi(error);
    return { ok: false, error: { code: mapped.code ?? "INTERNAL_ERROR", message: mapped.message } };
  }
}

// ── Aportar a una meta / anular un movimiento (spec §11 write-actions-2) ──────

const goalService = createGoalService();

const allocateSchema = z.object({ goalId: z.string().min(1), amount: z.string().trim().min(1) });

export type KaiAllocateResult =
  | { ok: true; goalId: string }
  | { ok: false; error: { code: string; message: string } };

export async function kaiAllocateToGoalAction(input: z.input<typeof allocateSchema>): Promise<KaiAllocateResult> {
  const user = await requireCurrentUser();
  const parsed = allocateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "INVALID_INPUT", message: "No pude interpretar el aporte." } };
  try {
    await goalService.contribute({ id: user.id }, parsed.data.goalId, parsed.data.amount, { note: "Aporte por KAI" });
    return { ok: true, goalId: parsed.data.goalId };
  } catch (error) {
    const mapped = mapErrorToUi(error);
    return { ok: false, error: { code: mapped.code ?? "INTERNAL_ERROR", message: mapped.message } };
  }
}

export async function kaiVoidTransactionAction(transactionId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireCurrentUser();
  try {
    await service.voidTransaction(user.id, String(transactionId));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error).message };
  }
}

// ── Pagar una cuota/obligación por chat (spec §11 write-actions-2) ───────────

const debtPaymentService = createDebtPaymentService();

const payObligationSchema = z.object({ debtId: z.string().min(1), amount: z.string().trim().min(1), currencyCode: z.string().min(1) });

export type KaiPayObligationResult = { ok: true } | { ok: false; error: { code: string; message: string } };

/**
 * Pays the earliest unpaid installment of a debt from a KAI confirmation card. The account is
 * picked automatically — same currency-first, `ACCOUNT_PRIORITY` policy as `kaiCreateTransactionAction`
 * — since the card already showed the exact amount before the user tapped "Confirmar pago".
 */
export async function kaiPayObligationAction(input: z.input<typeof payObligationSchema>): Promise<KaiPayObligationResult> {
  const user = await requireCurrentUser();
  const parsed = payObligationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "INVALID_INPUT", message: "No pude interpretar el pago." } };
  const { debtId, amount, currencyCode } = parsed.data;

  const userAccounts = await accountRepository.listForUser(user.id);
  const pool = userAccounts.filter((a) => a.currencyCode === currencyCode);
  if (pool.length === 0) {
    return { ok: false, error: { code: "NO_ACCOUNT", message: `No tenés una cuenta en ${currencyCode} para pagar esto.` } };
  }
  const account = [...pool].sort((a, b) => (ACCOUNT_PRIORITY[a.type] ?? 9) - (ACCOUNT_PRIORITY[b.type] ?? 9))[0];

  try {
    await debtPaymentService.recordDebtPayment(user, { debtId, accountId: account.id, amount, commandId: randomUUID() });
    return { ok: true };
  } catch (error) {
    const mapped = mapErrorToUi(error);
    return { ok: false, error: { code: mapped.code ?? "INTERNAL_ERROR", message: mapped.message } };
  }
}

// ── Cambiar la categoría de un movimiento por chat (spec §11 write-actions-2) ─

const editCategorySchema = z.object({
  transactionId: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().trim().min(1),
});

export type KaiEditCategoryResult = { ok: true } | { ok: false; error: { code: string; message: string } };

export async function kaiEditTransactionCategoryAction(input: z.input<typeof editCategorySchema>): Promise<KaiEditCategoryResult> {
  const user = await requireCurrentUser();
  const parsed = editCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "INVALID_INPUT", message: "No pude interpretar el cambio de categoría." } };
  const { transactionId, categoryId, description } = parsed.data;
  try {
    await service.editTransaction(user.id, transactionId, { description, categoryId });
    return { ok: true };
  } catch (error) {
    const mapped = mapErrorToUi(error);
    return { ok: false, error: { code: mapped.code ?? "INTERNAL_ERROR", message: mapped.message } };
  }
}

// ── Transferir entre cuentas por chat (spec §11 write-actions-2) ────────────

const transferService = createTransferService();

const createTransferChatSchema = z.object({ fromAccountId: z.string().min(1), toAccountId: z.string().min(1), amount: z.string().trim().min(1) });

export type KaiTransferResult = { ok: true } | { ok: false; error: { code: string; message: string } };

export async function kaiCreateTransferAction(input: z.input<typeof createTransferChatSchema>): Promise<KaiTransferResult> {
  const user = await requireCurrentUser();
  const parsed = createTransferChatSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "INVALID_INPUT", message: "No pude interpretar la transferencia." } };
  const { fromAccountId, toAccountId, amount } = parsed.data;

  const occurredAt = resolveOccurredAtISO(getTodayInTimezone(user.timezone), user.timezone);
  try {
    await transferService.createTransfer(user, { fromAccountId, toAccountId, amount, occurredAt, commandId: randomUUID() });
    return { ok: true };
  } catch (error) {
    const mapped = mapErrorToUi(error);
    return { ok: false, error: { code: mapped.code ?? "INTERNAL_ERROR", message: mapped.message } };
  }
}
