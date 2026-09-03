"use server";

import { revalidatePath } from "next/cache";

import { parseCaptureWithAI } from "@know-finanzas/ai";
import {
  accountRepository,
  categoryMapRepository,
  categoryRepository,
  classificationRuleRepository,
  merchantRepository,
  merchantUserDefaultRepository,
  normalizeMerchant,
  quickTemplateRepository,
  transactionRepository,
} from "@know-finanzas/db";
import { getTodayInTimezone } from "@/lib/date";

import { aiProvider, executeAICapability } from "@/lib/ai/execute-ai-capability.instance";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createTransactionService } from "@/features/transactions/services/transaction-service";
import {
  createExpenseTransactionSchema,
  createIncomeTransactionSchema,
} from "@/features/transactions/schemas/transaction-schemas";
import { toEditableAmount } from "../lib/amount-text";
import {
  mapMerchantAutocompleteSuggestions,
  type MerchantAutocompleteSuggestion,
} from "../lib/merchant-autocomplete";
import { buildQuickTransactionInput } from "../lib/quick-transaction-input";
import { createCaptureParserService } from "../services/capture-parser-service";

// Progressive trust (#13): a merchant→category pattern is prefilled only once it has been
// seen at least this many times for the user; below that it stays a soft suggestion.
const PROGRESSIVE_TRUST_PREFILL_MIN = 3;

const service = createTransactionService({
  accounts: accountRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  merchants: merchantRepository,
  categoryMap: categoryMapRepository,
  merchantDefaults: merchantUserDefaultRepository,
  classificationRules: classificationRuleRepository,
});

const captureParser = createCaptureParserService({
  executeAI: executeAICapability,
  parseWithAI: (input) => parseCaptureWithAI(aiProvider, input),
});

export type QuickTemplate = {
  id: string;
  label: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  accountId: string | null;
  categoryId: string | null;
  merchantText: string | null;
  amountHints: string[];
};

export type QuickAddContext = {
  accounts: Array<{ id: string; name: string; currencyCode: string }>;
  categories: Array<{ id: string; name: string; type: "INCOME" | "EXPENSE" }>;
  templates: QuickTemplate[];
  timezone: string;
  hasTwoAccounts: boolean;
  hasAccount: boolean;
};

export async function getQuickAddContextAction(): Promise<QuickAddContext> {
  const user = await requireCurrentUser();
  const [accounts, categories, templates] = await Promise.all([
    accountRepository.listForUser(user.id),
    categoryRepository.listForUser(user.id),
    quickTemplateRepository.listForUser(user.id),
  ]);
  return {
    accounts: accounts.map((a) => ({ id: a.id, name: a.name, currencyCode: a.currencyCode })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    templates: templates.map((t) => ({
      id: t.id,
      label: t.label,
      type: t.type,
      description: t.description,
      accountId: t.accountId,
      categoryId: t.categoryId,
      merchantText: t.merchantText,
      amountHints: Array.isArray(t.amountHints) ? (t.amountHints as string[]) : [],
    })),
    timezone: user.timezone,
    hasTwoAccounts: accounts.length >= 2,
    hasAccount: accounts.length >= 1,
  };
}

export async function searchMerchantSuggestionsAction(
  rawQuery: string,
): Promise<MerchantAutocompleteSuggestion[]> {
  const user = await requireCurrentUser();
  if (typeof rawQuery !== "string") return [];
  const query = rawQuery.trim().slice(0, 80);
  if (normalizeMerchant(query).length < 2) return [];

  const [matches, mappings, personalDefaults] = await Promise.all([
    merchantRepository.search(query, user.id, 6),
    categoryMapRepository.listForUser(user.id),
    merchantUserDefaultRepository.listForUser(user.id),
  ]);
  return mapMerchantAutocompleteSuggestions(matches, mappings, personalDefaults);
}

export type QuickParseResult = {
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: string | null;
  description: string;
  /** Canonical merchant name if it resolved, else the raw fragment, else null. */
  merchant: string | null;
  merchantId: string | null;
  /** A user category id inferred from the resolved merchant, if the user has one mapped. */
  categoryId: string | null;
  /**
   * How established this merchant→category pattern is for the user (progressive trust, #13):
   * "ask" = show it as a question to confirm, "auto_undo" / "silent" = safe to apply.
   */
  categoryAutomationLevel: "ask" | "auto_undo" | "silent" | null;
  institutionText: string | null;
  confidence: number;
  ambiguities: string[];
  source: "DETERMINISTIC" | "AI";
  /** One-line human summary of what was understood. */
  interpretation: string;
};

export async function parseQuickTextAction(text: string, operationId?: string): Promise<QuickParseResult> {
  const user = await requireCurrentUser();
  const safeOperationId = operationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId)
    ? operationId
    : undefined;
  const { draft: parsed, source } = await captureParser.parse(user.id, text, safeOperationId);

  let merchant = parsed.merchantText;
  let merchantId: string | null = null;
  let categoryId: string | null = null;
  let categoryAutomationLevel: "ask" | "auto_undo" | "silent" | null = null;

  if (parsed.type === "EXPENSE" && parsed.merchantText) {
    const match = await merchantRepository.resolveRaw(parsed.merchantText, user.id).catch(() => null);
    if (match) {
      merchant = match.canonicalName;
      merchantId = match.merchantId;
      // The user's personal override for this merchant wins over its global default.
      const personal = await merchantUserDefaultRepository
        .findForUserMerchant(user.id, match.merchantId)
        .catch(() => undefined);
      const nodeId = personal?.taxonomyNodeId ?? match.defaultTaxonomyNodeId;
      if (nodeId) {
        const mapped = await categoryMapRepository
          .findUserCategoryForNode(nodeId, user.id)
          .catch(() => undefined);
        if (mapped?.userCategoryId) {
          categoryId = mapped.userCategoryId;
          // Progressive trust (#13): how established is this merchant→category pattern?
          const priorCount = personal
            ? PROGRESSIVE_TRUST_PREFILL_MIN
            : await transactionRepository
                .countClassifiedForMerchantNode(user.id, match.merchantId, nodeId)
                .catch(() => 0);
          categoryAutomationLevel =
            priorCount >= 10 ? "silent" : priorCount >= PROGRESSIVE_TRUST_PREFILL_MIN ? "auto_undo" : "ask";
        }
      }
    }
  }

  const parts: string[] = [];
  parts.push(parsed.type === "INCOME" ? "Ingreso" : parsed.type === "TRANSFER" ? "Transferencia" : "Gasto");
  if (parsed.amount) parts.push(`$${Number(parsed.amount).toLocaleString("es-AR")}`);
  parts.push(`· ${parsed.description}`);
  if (merchant && merchant.toLowerCase() !== parsed.description.toLowerCase()) parts.push(`en ${merchant}`);
  if (parsed.institutionText) parts.push(`(${parsed.institutionText})`);

  return {
    type: parsed.type,
    amount: parsed.amount,
    description: parsed.description,
    merchant,
    merchantId,
    categoryId,
    categoryAutomationLevel,
    institutionText: parsed.institutionText,
    confidence: parsed.confidence,
    ambiguities: parsed.ambiguities,
    source,
    interpretation: parts.join(" "),
  };
}

export type QuickResult =
  | { ok: true; transactionId: string; type: "INCOME" | "EXPENSE"; amount: string; currencyCode: string }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function quickCreateTransactionAction(
  _previous: QuickResult | null,
  formData: FormData,
): Promise<QuickResult> {
  const type = formData.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  try {
    const user = await requireCurrentUser();
    const raw = buildQuickTransactionInput(type, formData, `${getTodayInTimezone(user.timezone)}T12:00:00Z`);
    const created =
      type === "INCOME"
        ? await service.createIncomeTransaction(user.id, createIncomeTransactionSchema.parse(raw), user.timezone)
        : await service.createExpenseTransaction(user.id, createExpenseTransactionSchema.parse(raw), user.timezone);

    const row = created as { id: string; amount: string; currencyCode: string };

    const templateId = formData.get("templateId");
    if (typeof templateId === "string" && templateId) {
      await quickTemplateRepository.recordUse(templateId, user.id, row.amount).catch(() => undefined);
    }

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { ok: true, transactionId: row.id, type, amount: row.amount, currencyCode: row.currencyCode };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function quickVoidTransactionAction(transactionId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await service.voidTransaction(user.id, transactionId);
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export type RepeatPrefill = {
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string;
  merchant: string | null;
  categoryId: string | null;
  accountId: string | null;
};

/** Prefill data for "Registrar de nuevo" from an existing transaction. */
export async function getRepeatPrefillAction(transactionId: string): Promise<RepeatPrefill | null> {
  const user = await requireCurrentUser();
  const txn = await transactionRepository.findByIdForUser(transactionId, user.id);
  if (!txn || (txn.type !== "INCOME" && txn.type !== "EXPENSE")) return null;
  return {
    type: txn.type,
    amount: toEditableAmount(txn.amount),
    description: txn.description,
    merchant: txn.merchant ?? null,
    categoryId: txn.categoryId ?? null,
    accountId: txn.accountId,
  };
}

export type TemplateActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

/** "Guardar como acción rápida" from a transaction detail. */
export async function createTemplateFromTransactionAction(
  _previous: TemplateActionState | null,
  formData: FormData,
): Promise<TemplateActionState> {
  try {
    const user = await requireCurrentUser();
    const transactionId = String(formData.get("transactionId"));
    const label = String(formData.get("label") ?? "").trim();
    if (!label) return { ok: false, error: mapErrorToUi(new Error("label")) };

    const txn = await transactionRepository.findByIdForUser(transactionId, user.id);
    if (!txn || (txn.type !== "INCOME" && txn.type !== "EXPENSE")) {
      return { ok: false, error: mapErrorToUi(new Error("not found")) };
    }
    await quickTemplateRepository.create({
      userId: user.id,
      label: label.slice(0, 40),
      type: txn.type,
      description: txn.description,
      accountId: txn.accountId,
      categoryId: txn.categoryId ?? null,
      merchantText: txn.merchant ?? null,
      amountHints: [toEditableAmount(txn.amount)],
    });
    revalidatePath("/transactions");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function deleteTemplateAction(templateId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await quickTemplateRepository.deleteForUser(templateId, user.id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
