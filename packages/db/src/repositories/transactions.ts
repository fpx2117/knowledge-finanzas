import { and, desc, eq, gte, inArray, isNull, lte, notInArray, sql } from "drizzle-orm";
import Decimal from "decimal.js";

import type { Database } from "../client";
import { transactions } from "../schema";
import { isUniqueViolation } from "../pg-errors";

export function createTransactionRepository(database: Database) {
  /** The row for this user's idempotency key, or undefined. */
  function findByCommandId(userId: string, commandId: string) {
    return database
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.commandId, commandId)))
      .limit(1)
      .then(([transaction]) => transaction);
  }

  return {
    findByCommandId,

    async create(input: {
      userId: string; accountId: string; categoryId: string | null;
      type: "INCOME" | "EXPENSE" | "REFUND" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"; amount: string; currencyCode: string;
      description: string; merchant: string | null; merchantId?: string | null;
      taxonomyNodeId?: string | null;
      paymentMethod?: "CASH" | "DEBIT" | "CREDIT" | "TRANSFER" | "WALLET" | "OTHER" | null;
      classification?: unknown;
      occurredAt: Date;
      postedAt: Date; source: "MANUAL"; notes: string | null; commandId?: string | null; originalTransactionId?: string | null; relatedTransactionId?: string | null; reason?: string | null;
    }) {
      try {
        return await database.insert(transactions).values({ ...input, status: "POSTED" }).returning().then(([transaction]) => transaction);
      } catch (error) {
        // A concurrent request with the same idempotency key already inserted this row —
        // return the winner instead of surfacing the conflict.
        if (input.commandId && isUniqueViolation(error, "transactions_user_command_unique")) {
          return findByCommandId(input.userId, input.commandId);
        }
        throw error;
      }
    },

    /**
     * How many times this user has already had a non-voided expense for this merchant land
     * on this taxonomy node — the evidence that a merchant→category classification is
     * trusted (progressive trust, #13 / spec §44).
     */
    countClassifiedForMerchantNode(userId: string, merchantId: string, taxonomyNodeId: string) {
      return database
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.merchantId, merchantId),
          eq(transactions.taxonomyNodeId, taxonomyNodeId),
          eq(transactions.type, "EXPENSE"),
          eq(transactions.status, "POSTED"),
        ))
        .then(([row]) => row?.count ?? 0);
    },

    /** Posted expenses since `since`, minimal shape, for recurring-series detection (#16 / §15). */
    listExpensesSinceForUser(userId: string, since: Date) {
      return database
        .select({
          merchantId: transactions.merchantId,
          merchant: transactions.merchant,
          description: transactions.description,
          amount: transactions.amount,
          currencyCode: transactions.currencyCode,
          occurredAt: transactions.occurredAt,
          categoryId: transactions.categoryId,
        })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, "EXPENSE"),
          eq(transactions.status, "POSTED"),
          gte(transactions.occurredAt, since),
        ))
        .orderBy(transactions.occurredAt);
    },

    /** Posted INCOME/EXPENSE rows for one account within a date window — for duplicate checks (§20). */
    listAroundForDuplicateCheck(userId: string, accountId: string, from: Date, to: Date) {
      return database
        .select({
          id: transactions.id,
          type: transactions.type,
          description: transactions.description,
          merchant: transactions.merchant,
          merchantId: transactions.merchantId,
          amount: transactions.amount,
          currencyCode: transactions.currencyCode,
          occurredAt: transactions.occurredAt,
          paymentMethod: transactions.paymentMethod,
        })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.accountId, accountId),
          eq(transactions.status, "POSTED"),
          inArray(transactions.type, ["INCOME", "EXPENSE"]),
          gte(transactions.occurredAt, from),
          lte(transactions.occurredAt, to),
        ))
        .orderBy(desc(transactions.occurredAt));
    },

    /** All posted income/expense rows since `since`, minimal fingerprint shape — for the duplicate review scan. */
    listPostedForDuplicateScan(userId: string, since: Date) {
      return database
        .select({
          id: transactions.id,
          type: transactions.type,
          accountId: transactions.accountId,
          description: transactions.description,
          merchant: transactions.merchant,
          merchantId: transactions.merchantId,
          amount: transactions.amount,
          currencyCode: transactions.currencyCode,
          occurredAt: transactions.occurredAt,
          paymentMethod: transactions.paymentMethod,
        })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "POSTED"),
          inArray(transactions.type, ["INCOME", "EXPENSE"]),
          gte(transactions.occurredAt, since),
        ))
        .orderBy(desc(transactions.occurredAt));
    },

    /** Posted expenses with no category — the financial inbox's "sin categoría" list. */
    listUncategorizedForUser(userId: string, limit = 50) {
      return database
        .select({
          id: transactions.id,
          description: transactions.description,
          merchant: transactions.merchant,
          amount: transactions.amount,
          currencyCode: transactions.currencyCode,
          occurredAt: transactions.occurredAt,
        })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, "EXPENSE"),
          eq(transactions.status, "POSTED"),
          isNull(transactions.categoryId),
        ))
        .orderBy(desc(transactions.occurredAt))
        .limit(limit);
    },

    countUncategorizedForUser(userId: string) {
      return database
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, "EXPENSE"),
          eq(transactions.status, "POSTED"),
          isNull(transactions.categoryId),
        ))
        .then(([row]) => row?.count ?? 0);
    },

    findByIdForUser(transactionId: string, userId: string) {
      return database.select().from(transactions)
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
        .limit(1)
        .then(([transaction]) => transaction);
    },

    listForUser(userId: string, options: { accountId?: string; categoryId?: string; type?: "INCOME" | "EXPENSE"; from?: Date; to?: Date; limit?: number; offset?: number } = {}) {
      return database.select().from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          notInArray(transactions.type, ["TRANSFER_IN", "TRANSFER_OUT"]),
          options.accountId ? eq(transactions.accountId, options.accountId) : undefined,
          options.categoryId ? eq(transactions.categoryId, options.categoryId) : undefined,
          options.type ? eq(transactions.type, options.type) : undefined,
          options.from ? gte(transactions.occurredAt, options.from) : undefined,
          options.to ? lte(transactions.occurredAt, options.to) : undefined,
        ))
        .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
        .limit(options.limit ?? 50)
        .offset(options.offset ?? 0);
    },

    // CM-02 (spec 14 §9): bounded edit — description/merchant/category/notes only, never
    // amount/date/account/type (those require anular + registrar de nuevo). When the category
    // changes, `taxonomyNodeId` moves with it and the classification is marked user-explicit —
    // same provenance `setCategoryForUser` records, so "¿Por qué esta categoría?" stays accurate.
    updateMetadataForUser(
      transactionId: string,
      userId: string,
      input: { description: string; merchant: string | null; categoryId: string | null; notes: string | null; taxonomyNodeId?: string | null; categoryChanged?: boolean },
    ) {
      const { categoryChanged, ...fields } = input;
      return database.update(transactions).set({
        ...fields,
        updatedAt: new Date(),
        ...(categoryChanged
          ? { classification: sql`coalesce(${transactions.classification}, '{}'::jsonb) || '{"method":"user_explicit","reviewedByUser":true,"categoryConfidence":1}'::jsonb` }
          : {}),
      })
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId), eq(transactions.status, "POSTED")))
        .returning().then(([transaction]) => transaction);
    },

    /** Assign (or change) a category on a posted transaction — from the inbox / manual review. */
    /**
     * WP-RULES-PREVIEW (spec 11 §6.8/§6.9/§6.10) — POSTED income/expense transactions whose
     * merchant/description matches a rule's pattern. §6.10: a manual correction wins, so rows
     * with `classification.reviewedByUser = true` are excluded (they're returned separately as
     * `protectedByManual` for the preview count, via `includeProtected`).
     */
    listMatchingRulePatternForUser(
      userId: string,
      input: {
        matcher: "MERCHANT" | "DESCRIPTION";
        mode: "CONTAINS" | "EQUALS" | "STARTS_WITH";
        pattern: string;
        from?: Date;
      },
    ) {
      const needle = input.pattern.trim().toLowerCase();
      const field = input.matcher === "MERCHANT" ? sql`lower(coalesce(${transactions.merchant}, ''))` : sql`lower(${transactions.description})`;
      const escaped = needle.replace(/[\\%_]/g, (ch) => `\\${ch}`);
      const likePattern =
        input.mode === "EQUALS" ? escaped : input.mode === "STARTS_WITH" ? `${escaped}%` : `%${escaped}%`;
      const matches = input.mode === "EQUALS" ? sql`${field} = ${needle}` : sql`${field} like ${likePattern}`;

      return database
        .select({
          id: transactions.id,
          type: transactions.type,
          description: transactions.description,
          merchant: transactions.merchant,
          amount: transactions.amount,
          currencyCode: transactions.currencyCode,
          categoryId: transactions.categoryId,
          occurredAt: transactions.occurredAt,
          reviewedByUser: sql<boolean>`coalesce((${transactions.classification} ->> 'reviewedByUser') = 'true', false)`,
        })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "POSTED"),
          inArray(transactions.type, ["INCOME", "EXPENSE"]),
          matches,
          input.from ? gte(transactions.occurredAt, input.from) : undefined,
        ))
        .orderBy(desc(transactions.occurredAt));
    },

    /** Bulk-apply a rule's category to already-posted rows (not user-reviewed). Records the
     * `user_rule` provenance so "¿Por qué esta categoría?" stays accurate and a later manual
     * edit still wins. */
    applyRuleCategoryForUser(
      userId: string,
      transactionIds: string[],
      input: { categoryId: string; taxonomyNodeId: string | null; ruleId: string; matcher: string; mode: string; pattern: string },
    ) {
      if (transactionIds.length === 0) return Promise.resolve(0);
      const patch = JSON.stringify({
        method: "user_rule",
        reviewedByUser: false,
        categoryConfidence: 1,
        ruleId: input.ruleId,
        ruleMatcher: input.matcher,
        ruleMode: input.mode,
        rulePattern: input.pattern,
        automationLevel: "retroactive",
      });
      return database
        .update(transactions)
        .set({
          categoryId: input.categoryId,
          taxonomyNodeId: input.taxonomyNodeId,
          classification: sql`coalesce(${transactions.classification}, '{}'::jsonb) || ${patch}::jsonb`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(transactions.userId, userId),
          inArray(transactions.id, transactionIds),
          eq(transactions.status, "POSTED"),
        ))
        .returning({ id: transactions.id })
        .then((rows) => rows.length);
    },

    /**
     * WP-SHELL-PALETTE (spec 13 §15.3 "Buscar entidad", §22 ownership at source) — a small
     * text search over the user's own movements for the command palette. Read-only.
     */
    searchForUser(userId: string, query: string, limit = 6) {
      const needle = query.trim().toLowerCase();
      if (needle.length < 2) return Promise.resolve([] as Array<{ id: string; description: string; merchant: string | null; amount: string; currencyCode: string; type: string; occurredAt: Date }>);
      const escaped = needle.replace(/[\\%_]/g, (ch) => `\\${ch}`);
      return database
        .select({
          id: transactions.id,
          description: transactions.description,
          merchant: transactions.merchant,
          amount: transactions.amount,
          currencyCode: transactions.currencyCode,
          type: transactions.type,
          occurredAt: transactions.occurredAt,
        })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "POSTED"),
          sql`(lower(${transactions.description}) like ${`%${escaped}%`} or lower(coalesce(${transactions.merchant}, '')) like ${`%${escaped}%`})`,
        ))
        .orderBy(desc(transactions.occurredAt))
        .limit(limit);
    },

    setCategoryForUser(transactionId: string, userId: string, categoryId: string, taxonomyNodeId: string | null) {
      return database
        .update(transactions)
        .set({
          categoryId,
          taxonomyNodeId,
          classification: sql`coalesce(${transactions.classification}, '{}'::jsonb) || '{"method":"user_explicit","reviewedByUser":true,"categoryConfidence":1}'::jsonb`,
          updatedAt: new Date(),
        })
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId), eq(transactions.status, "POSTED")))
        .returning()
        .then(([row]) => row);
    },

    voidForUser(transactionId: string, userId: string, voidedAt: Date) {
      return database.update(transactions).set({ status: "VOIDED", voidedAt, updatedAt: voidedAt })
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId), eq(transactions.status, "POSTED")))
        .returning().then(([transaction]) => transaction);
    },

    sumPostedRefundsForOriginal(originalTransactionId: string, userId: string) {
      return database.select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.originalTransactionId, originalTransactionId), eq(transactions.type, "REFUND"), eq(transactions.status, "POSTED")))
        .then(([row]) => row?.total ?? "0");
    },

    createRefundAtomic(input: { userId: string; accountId: string; originalTransactionId: string; amount: string; currencyCode: string; description: string; occurredAt: Date; postedAt: Date; source: "MANUAL"; notes: string | null; categoryId: string | null }) {
      return database.transaction(async (tx) => {
        const [original] = await tx.select().from(transactions).where(and(eq(transactions.id, input.originalTransactionId), eq(transactions.userId, input.userId))).for("update");
        if (!original || original.type !== "EXPENSE" || original.status !== "POSTED" || original.accountId !== input.accountId || original.currencyCode !== input.currencyCode) return undefined;
        const [total] = await tx.select({ value: sql<string>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions).where(and(eq(transactions.originalTransactionId, original.id), eq(transactions.userId, input.userId), eq(transactions.type, "REFUND"), eq(transactions.status, "POSTED")));
        if (new Decimal(total?.value ?? "0").plus(input.amount).gt(original.amount)) return undefined;
        return tx.insert(transactions).values({ ...input, type: "REFUND", status: "POSTED" }).returning().then(([transaction]) => transaction);
      });
    },
  };
}
