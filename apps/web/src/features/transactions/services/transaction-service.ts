import { getCurrencyMetadata, Money, todayInTimezone } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "@/lib/billing/product-access-gate";
import { matchClassificationRule, type ClassificationRule } from "@/features/transactions/lib/classification-rules";
import { DUPLICATE_BLOCK_THRESHOLD, duplicateScore, type FingerprintInput } from "@/features/transactions/lib/transaction-fingerprint";

type AccountType = "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS";
type Account = { id: string; userId: string; type: AccountType; currencyCode: string; openingDate: string; status: "ACTIVE" | "ARCHIVED" };
type Category = { id: string; userId: string; type: "INCOME" | "EXPENSE"; status: "ACTIVE" | "ARCHIVED" };
type TxnType = "INCOME" | "EXPENSE";
type TransactionInput = { accountId: string; amount: string; description: string; categoryId?: string; occurredAt: string; notes?: string; merchant?: string; merchantId?: string };

type MerchantAliasMatchType = "EXACT" | "PREFIX" | "CONTAINS" | "REGEX";
type MerchantMatch = { merchantId: string; canonicalName?: string; defaultTaxonomyNodeId: string | null; confidence?: number; matchType?: MerchantAliasMatchType };
type MerchantRecord = { id: string; canonicalName: string; defaultTaxonomyNodeId: string | null };
type PaymentMethod = "CASH" | "DEBIT" | "CREDIT" | "TRANSFER" | "WALLET" | "OTHER";

const PAYMENT_METHOD_BY_ACCOUNT: Record<AccountType, PaymentMethod> = {
  CASH: "CASH",
  DIGITAL_WALLET: "WALLET",
  BANK: "DEBIT",
  SAVINGS: "DEBIT",
};
const AUTO_CATEGORY_MIN_CONFIDENCE = 0.8;
// Progressive trust (#13, spec §44). First couple of times a merchant→category pattern is
// seen the system only suggests it (the user confirms); after that it auto-applies (with an
// undo affordance); once well-established it is applied silently.
const PROGRESSIVE_TRUST_ASK_MAX = 2;
const PROGRESSIVE_TRUST_SILENT_MIN = 10;
type AutomationLevel = "ask" | "auto_undo" | "silent";

type Dependencies = {
  accounts: { findByIdForUser(id: string, userId: string): Promise<Account | undefined> };
  categories: { findByIdForUser(id: string, userId: string): Promise<Category | undefined> };
  transactions: {
    create(input: Record<string, unknown>): Promise<{ id: string; currencyCode: string } | unknown>;
    findByIdForUser(
      id: string,
      userId: string,
    ): Promise<{ id: string; status: "POSTED" | "VOIDED" } | undefined>;
    voidForUser(id: string, userId: string, at: Date): Promise<unknown>;
    /** Progressive trust (#13): prior non-voided expenses for this merchant on this node. */
    countClassifiedForMerchantNode?(userId: string, merchantId: string, taxonomyNodeId: string): Promise<number>;
    /** Duplicate check (§20): posted income/expense on one account within a date window. */
    listAroundForDuplicateCheck?(userId: string, accountId: string, from: Date, to: Date): Promise<Array<{
      id: string;
      type: string;
      description: string;
      merchant: string | null;
      merchantId: string | null;
      amount: string;
      currencyCode: string;
      occurredAt: Date;
      paymentMethod: string | null;
    }>>;
  };
  /** Optional — resolves a raw merchant string to a canonical merchant. */
  merchants?: {
    resolveRaw(raw: string, userId?: string): Promise<MerchantMatch | null>;
    findActiveById?(id: string): Promise<MerchantRecord | undefined>;
    addAlias?(input: {
      merchantId: string;
      rawOrPattern: string;
      matchType?: MerchantAliasMatchType;
      source: "SEED" | "IMPORT" | "USER" | "MODEL";
      addedByUserId?: string | null;
    }): Promise<unknown>;
  };
  /** Optional — maps a user category <-> canonical taxonomy node in both directions. */
  categoryMap?: {
    findUserCategoryForNode(nodeId: string, userId: string): Promise<{ userCategoryId: string; confidence?: string } | undefined>;
    resolveNodeForUserCategory(userCategoryId: string, userId: string): Promise<{ id: string } | undefined>;
  };
  /**
   * Optional — the user's personal "this merchant means this category for me" overrides.
   * Consulted before the merchant's global default; corrections are written here only, so
   * one user's learning never touches the global model (#12, spec §41/§44/§45).
   */
  merchantDefaults?: {
    findForUserMerchant(userId: string, merchantId: string): Promise<{ taxonomyNodeId: string } | undefined>;
    upsert(input: { userId: string; merchantId: string; taxonomyNodeId: string }): Promise<unknown>;
  };
  /**
   * Optional — the user's explicit classification rules (spec §82). Evaluated at the top of
   * the hierarchy: an active rule that matches always wins over any inferred category.
   */
  classificationRules?: {
    listActiveForUser(userId: string): Promise<ClassificationRule[]>;
  };
  now?: () => Date;
  gate?: ProductAccessGate;
};

export function createTransactionService({
  accounts,
  categories,
  transactions,
  merchants,
  categoryMap,
  merchantDefaults,
  classificationRules,
  now = () => new Date(),
  gate = allowAllProductAccessGate,
}: Dependencies) {
  async function create(userId: string, type: TxnType, input: TransactionInput, timezone: string) {
    await gate.assertCanWrite(userId);
    const account = await accounts.findByIdForUser(input.accountId, userId);
    if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND", { field: "accountId" });
    if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED", { field: "accountId" });

    const occurredAt = new Date(input.occurredAt);
    const current = now();
    if (
      Number.isNaN(occurredAt.getTime()) ||
      occurredAt > current ||
      todayInTimezone(occurredAt, timezone) < account.openingDate
    ) {
      throw new ApplicationError("INVALID_INPUT", { field: "occurredAt" });
    }

    const metadata = getCurrencyMetadata(account.currencyCode);
    const fractionalDigits = input.amount.split(".")[1]?.length ?? 0;
    if (fractionalDigits > metadata.decimalPlaces) throw new ApplicationError("INVALID_AMOUNT", { field: "amount" });

    let amount: string;
    try {
      amount = Money.fromPositiveString(input.amount, account.currencyCode).toString();
    } catch (error) {
      throw new ApplicationError("INVALID_AMOUNT", { field: "amount", cause: error });
    }

    let categoryId: string | null = null;
    if (input.categoryId) {
      const category = await categories.findByIdForUser(input.categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND", { field: "categoryId" });
      if (category.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED", { field: "categoryId" });
      if (category.type !== type) throw new ApplicationError("CATEGORY_TYPE_MISMATCH", { field: "categoryId" });
      categoryId = category.id;
    }

    // Explicit user rules (spec §82) sit at the top of the hierarchy: a matching active rule
    // wins over any merchant/model inference. Only consulted when the user did not pick a
    // category themselves; an invalid rule (deleted/archived/wrong-type category) is skipped.
    let matchedRule: ClassificationRule | null = null;
    if (!categoryId && classificationRules) {
      const rules = await classificationRules.listActiveForUser(userId).catch(() => [] as ClassificationRule[]);
      const candidate = matchClassificationRule(rules, { merchant: input.merchant, description: input.description });
      if (candidate) {
        const ruleCategory = await categories.findByIdForUser(candidate.categoryId, userId).catch(() => undefined);
        if (ruleCategory && ruleCategory.status === "ACTIVE" && ruleCategory.type === type) {
          categoryId = ruleCategory.id;
          matchedRule = candidate;
        }
      }
    }

    // Resolve the merchant string to a canonical merchant, and — when the user
    // picked no category — inherit the merchant's default category if they have
    // one mapped. This is the "don't re-categorize the same merchant twice" path.
    const typedMerchantRaw = type === "EXPENSE" ? input.merchant?.trim() || null : null;
    let merchantRaw = typedMerchantRaw;
    let merchantId: string | null = null;
    let merchantConfidence = 0;
    let merchantTaxonomyNodeId: string | null = null;
    let merchantGlobalNodeId: string | null = null;
    let merchantResolvedByFuzzyMatch = false;
    let merchantMatchType: MerchantAliasMatchType | undefined;
    let merchantCanonicalName: string | null = null;
    let inheritedCategoryConfidence = 0;
    let categoryInheritedFromMerchant = false;
    if (type === "EXPENSE" && input.merchantId && merchants?.findActiveById) {
      const selected = await merchants.findActiveById(input.merchantId);
      if (!selected) throw new ApplicationError("INVALID_INPUT", { field: "merchantId" });
      merchantId = selected.id;
      merchantRaw = selected.canonicalName;
      merchantCanonicalName = selected.canonicalName;
      merchantTaxonomyNodeId = selected.defaultTaxonomyNodeId;
      merchantConfidence = 1;
    } else if (merchantRaw && merchants) {
      const match = await merchants.resolveRaw(merchantRaw, userId).catch(() => null);
      if (match) {
        merchantId = match.merchantId;
        merchantConfidence = match.confidence ?? 0.8;
        merchantTaxonomyNodeId = match.defaultTaxonomyNodeId;
        merchantResolvedByFuzzyMatch = true;
        merchantMatchType = match.matchType;
        merchantCanonicalName = match.canonicalName ?? null;
      }
    }
    merchantGlobalNodeId = merchantTaxonomyNodeId;

    // A personal merchant->category override (learned from past corrections) wins over the
    // merchant's global default. Never falls back to the global model once the user has taught one.
    let personalDefaultNodeId: string | null = null;
    if (type === "EXPENSE" && merchantId && merchantDefaults) {
      const personal = await merchantDefaults.findForUserMerchant(userId, merchantId).catch(() => undefined);
      if (personal) {
        personalDefaultNodeId = personal.taxonomyNodeId;
        merchantTaxonomyNodeId = personal.taxonomyNodeId;
      }
    }

    let automationLevel: AutomationLevel | null = null;
    let suggestedCategoryId: string | null = null;
    let suggestedTaxonomyNodeId: string | null = null;
    let inheritedCategorySource: "personal_default" | "merchant_default" | null = null;
    let priorSimilarCount: number | null = null;
    if (!categoryId && merchantTaxonomyNodeId && categoryMap) {
      const mapped = await categoryMap.findUserCategoryForNode(merchantTaxonomyNodeId, userId).catch(() => undefined);
      if (mapped) {
        // A personal override is user-taught: trust it fully, independent of the merchant match score.
        const isPersonal = merchantTaxonomyNodeId === personalDefaultNodeId;
        const mappingConfidence = Number(mapped.confidence ?? merchantConfidence);
        inheritedCategoryConfidence = isPersonal
          ? 1
          : Number.isFinite(mappingConfidence)
            ? Math.min(merchantConfidence, mappingConfidence)
            : merchantConfidence;
        if (inheritedCategoryConfidence >= AUTO_CATEGORY_MIN_CONFIDENCE) {
          // Progressive trust: how established is this exact merchant->node pattern for this user?
          priorSimilarCount =
            merchantId && transactions.countClassifiedForMerchantNode
              ? await transactions
                  .countClassifiedForMerchantNode(userId, merchantId, merchantTaxonomyNodeId)
                  .catch(() => 0)
              : null;
          const effectiveCount = priorSimilarCount ?? Number.POSITIVE_INFINITY;
          automationLevel =
            !isPersonal && effectiveCount <= PROGRESSIVE_TRUST_ASK_MAX
              ? "ask"
              : effectiveCount >= PROGRESSIVE_TRUST_SILENT_MIN
                ? "silent"
                : "auto_undo";
          inheritedCategorySource = isPersonal ? "personal_default" : "merchant_default";

          if (automationLevel === "ask") {
            // Not established enough to write silently — surface it for the user to confirm.
            suggestedCategoryId = mapped.userCategoryId;
            suggestedTaxonomyNodeId = merchantTaxonomyNodeId;
          } else {
            categoryId = mapped.userCategoryId;
            categoryInheritedFromMerchant = true;
          }
        }
      }
    }

    // Denormalize the canonical category, infer payment method, record how we classified.
    let taxonomyNodeId: string | null = null;
    if (categoryId && categoryMap) {
      const node = await categoryMap.resolveNodeForUserCategory(categoryId, userId).catch(() => undefined);
      taxonomyNodeId = node?.id ?? null;
    }
    const userPickedCategory = Boolean(input.categoryId);
    // How the merchant was identified — drives the "¿Por qué?" explanation (#14, spec §41).
    const merchantMatch: "selected" | "exact" | "prefix" | "contains" | "regex" | null =
      !merchantId
        ? null
        : !merchantResolvedByFuzzyMatch
          ? "selected"
          : (merchantMatchType?.toLowerCase() as "exact" | "prefix" | "contains" | "regex" | undefined) ?? "exact";
    const categorySource: "user" | "personal_default" | "merchant_default" | null = userPickedCategory
      ? "user"
      : categoryInheritedFromMerchant
        ? inheritedCategorySource
        : null;
    const classification = {
      categoryConfidence: userPickedCategory || matchedRule ? 1 : categoryInheritedFromMerchant ? inheritedCategoryConfidence : 0,
      merchantConfidence,
      method: userPickedCategory
        ? "user_explicit"
        : matchedRule
          ? "user_rule"
          : categoryInheritedFromMerchant
            ? "merchant_default"
            : suggestedCategoryId
              ? "suggested"
              : "none",
      reviewedByUser: userPickedCategory,
      ...(merchantId ? { merchantName: merchantCanonicalName ?? merchantRaw, merchantMatch } : {}),
      ...(matchedRule
        ? {
            ruleId: matchedRule.id,
            ruleMatcher: matchedRule.matcher,
            ruleMode: matchedRule.mode,
            rulePattern: matchedRule.pattern,
            automationLevel: "silent" as const,
          }
        : {}),
      ...(categorySource ? { categorySource } : {}),
      ...(priorSimilarCount !== null ? { priorSimilarCount } : {}),
      ...(!matchedRule && automationLevel ? { automationLevel } : {}),
      ...(suggestedCategoryId
        ? { suggestion: { categoryId: suggestedCategoryId, taxonomyNodeId: suggestedTaxonomyNodeId } }
        : {}),
    };

    const created = await transactions.create({
      userId,
      accountId: account.id,
      categoryId,
      taxonomyNodeId,
      paymentMethod: PAYMENT_METHOD_BY_ACCOUNT[account.type] ?? "OTHER",
      classification,
      type,
      amount,
      currencyCode: account.currencyCode,
      description: input.description.trim(),
      merchant: merchantRaw,
      merchantId,
      occurredAt,
      postedAt: current,
      source: "MANUAL",
      notes: input.notes?.trim() || null,
    });

    // Corrections as a learning signal (#12) — best-effort, never blocks the write.
    // Both writes are per-user only; the global merchant model is never touched.
    if (type === "EXPENSE" && merchantId) {
      // (a) The user explicitly chose a category that differs from what this merchant
      //     would have inferred -> remember it as their personal default for this merchant.
      if (
        merchantDefaults &&
        userPickedCategory &&
        taxonomyNodeId &&
        taxonomyNodeId !== merchantGlobalNodeId &&
        taxonomyNodeId !== personalDefaultNodeId
      ) {
        await merchantDefaults.upsert({ userId, merchantId, taxonomyNodeId }).catch(() => undefined);
      }
      // (b) A raw string the user typed fuzzily resolved to this merchant -> pin it as a
      //     private exact alias so it is an instant, confident match next time.
      if (
        merchants?.addAlias &&
        merchantResolvedByFuzzyMatch &&
        typedMerchantRaw &&
        typedMerchantRaw.length >= 3 &&
        (merchantMatchType === "PREFIX" || merchantMatchType === "CONTAINS")
      ) {
        await merchants
          .addAlias({ merchantId, rawOrPattern: typedMerchantRaw, matchType: "EXACT", source: "USER", addedByUserId: userId })
          .catch(() => undefined);
      }
    }

    return created;
  }

  /**
   * Is there already a posted transaction that looks like this one? (§20) Returns the best
   * near-certain match, or null. Used to warn before a manual create — never blocks.
   */
  async function findLikelyDuplicate(
    userId: string,
    type: TxnType,
    input: { accountId: string; amount: string; merchant?: string | null; occurredAt: string },
  ) {
    if (!transactions.listAroundForDuplicateCheck) return null;
    const account = await accounts.findByIdForUser(input.accountId, userId);
    if (!account) return null;

    const occurredAt = new Date(input.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) return null;
    const windowMs = 10 * 86_400_000;
    const recent = await transactions
      .listAroundForDuplicateCheck(userId, input.accountId, new Date(occurredAt.getTime() - windowMs), new Date(occurredAt.getTime() + windowMs))
      .catch(() => []);

    const paymentMethod = PAYMENT_METHOD_BY_ACCOUNT[account.type] ?? "OTHER";
    const candidate: FingerprintInput = {
      merchantId: null,
      merchant: input.merchant ?? null,
      amount: input.amount,
      currencyCode: account.currencyCode,
      occurredOn: occurredAt.toISOString().slice(0, 10),
      accountId: input.accountId,
      paymentMethod,
    };

    let best: { id: string; description: string; occurredOn: string; amount: string; score: number } | null = null;
    for (const row of recent) {
      if (row.type !== type) continue;
      const score = duplicateScore(candidate, {
        merchantId: row.merchantId,
        merchant: row.merchant,
        amount: row.amount,
        currencyCode: row.currencyCode,
        occurredOn: row.occurredAt.toISOString().slice(0, 10),
        accountId: input.accountId,
        paymentMethod: row.paymentMethod,
      });
      if (score >= DUPLICATE_BLOCK_THRESHOLD && (!best || score > best.score)) {
        best = { id: row.id, description: row.description, occurredOn: row.occurredAt.toISOString().slice(0, 10), amount: row.amount, score };
      }
    }
    return best;
  }

  return {
    createIncomeTransaction: (userId: string, input: TransactionInput, timezone: string) =>
      create(userId, "INCOME", input, timezone),
    createExpenseTransaction: (userId: string, input: TransactionInput, timezone: string) =>
      create(userId, "EXPENSE", input, timezone),
    findLikelyExpenseDuplicate: (userId: string, input: { accountId: string; amount: string; merchant?: string | null; occurredAt: string }) =>
      findLikelyDuplicate(userId, "EXPENSE", input),
    findLikelyIncomeDuplicate: (userId: string, input: { accountId: string; amount: string; occurredAt: string }) =>
      findLikelyDuplicate(userId, "INCOME", input),
    async voidTransaction(userId: string, transactionId: string) {
      await gate.assertCanWrite(userId);
      const transaction = await transactions.findByIdForUser(transactionId, userId);
      if (!transaction) throw new ApplicationError("TRANSACTION_NOT_FOUND");
      if (transaction.status === "VOIDED") throw new ApplicationError("TRANSACTION_ALREADY_VOIDED");
      return transactions.voidForUser(transactionId, userId, now());
    },
  };
}
