import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const accountTypeEnum = pgEnum("account_type", [
  "CASH",
  "BANK",
  "DIGITAL_WALLET",
  "SAVINGS",
]);

export const accountStatusEnum = pgEnum("account_status", ["ACTIVE", "ARCHIVED"]);

export const categoryTypeEnum = pgEnum("category_type", ["INCOME", "EXPENSE"]);

export const taxonomyLevelEnum = pgEnum("taxonomy_level", ["GROUP", "CATEGORY", "SUBCATEGORY"]);
export const categoryMapSourceEnum = pgEnum("category_map_source", ["SEED", "USER", "MODEL"]);
export const merchantAliasMatchTypeEnum = pgEnum("merchant_alias_match_type", ["EXACT", "PREFIX", "CONTAINS", "REGEX"]);
export const merchantAliasSourceEnum = pgEnum("merchant_alias_source", ["SEED", "IMPORT", "USER", "MODEL"]);
export const paymentMethodEnum = pgEnum("payment_method", ["CASH", "DEBIT", "CREDIT", "TRANSFER", "WALLET", "OTHER"]);

export const entityStatusEnum = pgEnum("entity_status", ["ACTIVE", "ARCHIVED"]);

export const transactionTypeEnum = pgEnum("transaction_type", ["INCOME", "EXPENSE", "REFUND", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "TRANSFER_IN", "TRANSFER_OUT", "LIABILITY_PAYMENT"]);

export const transactionStatusEnum = pgEnum("transaction_status", ["POSTED", "VOIDED"]);

export const transactionSourceEnum = pgEnum("transaction_source", ["MANUAL", "TRANSFER", "DEBT_PAYMENT", "SCHEDULED"]);
export const scheduledTransactionStatusEnum = pgEnum("scheduled_transaction_status", ["SCHEDULED", "POSTED", "SKIPPED", "CANCELLED"]);
export const scheduledTransactionSourceEnum = pgEnum("scheduled_transaction_source", ["MANUAL", "RECURRING"]);
export const recurringTransactionFrequencyEnum = pgEnum("recurring_transaction_frequency", ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);
export const recurringTransactionStatusEnum = pgEnum("recurring_transaction_status", ["ACTIVE", "PAUSED", "ENDED", "CANCELLED"]);
export const reminderSourceTypeEnum = pgEnum("reminder_source_type", ["DEBT_INSTALLMENT", "SCHEDULED_TRANSACTION"]);
export const reminderPresetEnum = pgEnum("reminder_preset", ["DUE_DATE", "BEFORE_1_DAY", "BEFORE_3_DAYS", "BEFORE_7_DAYS", "CUSTOM"]);
export const reminderChannelEnum = pgEnum("reminder_channel", ["IN_APP"]);
export const reminderStatusEnum = pgEnum("reminder_status", ["PENDING", "SENT", "CANCELLED"]);

export const debtTypeEnum = pgEnum("debt_type", ["PERSONAL_LOAN", "PURCHASE_INSTALLMENTS", "MONEY_OWED_TO_PERSON", "SERVICE_DEBT", "OTHER"]);
export const debtStatusEnum = pgEnum("debt_status", ["ACTIVE", "PAID", "OVERDUE", "CANCELLED"]);
export const interestTypeEnum = pgEnum("interest_type", ["NO_INTEREST", "FIXED_INSTALLMENTS", "MANUAL_INSTALLMENTS"]);
export const installmentStatusEnum = pgEnum("installment_status", ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]);
export const debtPaymentStatusEnum = pgEnum("debt_payment_status", ["POSTED", "REVERSED"]);

export const budgetPeriodEnum = pgEnum("budget_period", ["MONTHLY"]);
export const budgetAlertTypeEnum = pgEnum("budget_alert_type", ["BUDGET_NEAR_LIMIT", "BUDGET_EXCEEDED"]);

export const billingProviderEnum = pgEnum("billing_provider", ["MERCADO_PAGO"]);
export const billingIntervalEnum = pgEnum("billing_interval", ["MONTHLY"]);
export const billingSubscriptionStatusEnum = pgEnum("billing_subscription_status", ["PENDING", "ACTIVE", "PAST_DUE", "PAUSED", "CANCELLED", "EXPIRED"]);
export const billingPeriodStatusEnum = pgEnum("billing_period_status", ["PENDING", "ACTIVE", "CLOSED", "FAILED"]);
export const billingPaymentStatusEnum = pgEnum("billing_payment_status", ["PENDING", "APPROVED", "REJECTED", "REFUNDED", "CANCELLED"]);
export const billingWebhookEventStatusEnum = pgEnum("billing_webhook_event_status", ["RECEIVED", "PROCESSING", "PROCESSED", "FAILED", "IGNORED"]);
export const billingRefundReasonEnum = pgEnum("billing_refund_reason", ["DUPLICATE_CHARGE", "SERVICE_FAILURE", "FULL_SUBSCRIPTION_REVERSAL"]);
export const billingRefundStatusEnum = pgEnum("billing_refund_status", ["PENDING", "APPROVED", "FAILED"]);
export const billingDisputeStatusEnum = pgEnum("billing_dispute_status", ["OPEN", "WON", "LOST", "CLOSED"]);

export const promotionCodeStatusEnum = pgEnum("promotion_code_status", ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "REVOKED"]);
export const promotionDurationUnitEnum = pgEnum("promotion_duration_unit", ["DAYS"]);
export const promotionStackingPolicyEnum = pgEnum("promotion_stacking_policy", ["NOT_STACKABLE"]);
export const promotionRedemptionStatusEnum = pgEnum("promotion_redemption_status", ["REDEEMED", "REVOKED"]);
export const promotionalAccessGrantStatusEnum = pgEnum("promotional_access_grant_status", ["ACTIVE", "EXPIRED", "REVOKED"]);
export const promotionalAccessGrantSourceEnum = pgEnum("promotional_access_grant_source", ["CODE_REDEMPTION", "ADMIN_OVERRIDE", "MANUAL_PROMOTION", "REFERRAL_REWARD"]);
export const promotionAccessPeriodStatusEnum = pgEnum("promotion_access_period_status", ["ACTIVE", "CLOSED"]);

export const referralCodeStatusEnum = pgEnum("referral_code_status", ["ACTIVE", "REVOKED"]);
export const referralAttributionStatusEnum = pgEnum("referral_attribution_status", ["ATTRIBUTED", "CONVERTED", "INVALIDATED"]);
export const referralRewardStatusEnum = pgEnum("referral_reward_status", ["PENDING", "GRANTED", "FAILED", "INVALIDATED"]);
export const referralRewardTypeEnum = pgEnum("referral_reward_type", ["PROMOTIONAL_PRO_DAYS", "AI_CREDITS"]);
export const referralQualificationEventEnum = pgEnum("referral_qualification_event", ["FIRST_PAID_PRO_ACTIVATION"]);

export const aiCreditEntryTypeEnum = pgEnum("ai_credit_entry_type", ["TRIAL_GRANT", "PLAN_GRANT", "PURCHASE_GRANT", "CONSUMPTION", "REFUND", "EXPIRATION", "PROMOTIONAL_GRANT", "ADMIN_CREDIT_ADJUSTMENT", "ADMIN_DEBIT_ADJUSTMENT", "REFERRAL_REWARD_GRANT"]);
export const aiCreditPoolEnum = pgEnum("ai_credit_pool", ["TRIAL_ALLOWANCE", "PLAN_ALLOWANCE", "PURCHASED"]);
export const aiCreditReservationStatusEnum = pgEnum("ai_credit_reservation_status", ["PENDING", "COMMITTED", "RELEASED", "EXPIRED"]);

export const notificationCategoryEnum = pgEnum("notification_category", ["FINANCIAL", "BILLING", "SECURITY", "ACCOUNT", "PRODUCT"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "DEBT_DUE_SOON", "DEBT_OVERDUE", "SCHEDULED_TRANSACTION_DUE", "BUDGET_NEAR_LIMIT", "BUDGET_EXCEEDED",
  "CASHFLOW_LOW", "CASHFLOW_NEGATIVE", "WEEKLY_FINANCIAL_SUMMARY", "MONTHLY_FINANCIAL_SUMMARY",
  "SUBSCRIPTION_ACTIVATED", "PAYMENT_FAILED", "GRACE_PERIOD_STARTED", "SUBSCRIPTION_CANCELLED", "SUBSCRIPTION_EXPIRED",
  "NEW_LOGIN", "PASSWORD_CHANGED", "EMAIL_CHANGED", "SECURITY_SETTING_CHANGED",
  "TRIAL_STARTED", "TRIAL_ENDING", "TRIAL_EXPIRED", "ACCOUNT_EXPORT_READY", "ACCOUNT_DELETION_REQUESTED",
  "AI_CREDITS_LOW", "PROMOTION_STARTED", "PROMOTION_ENDING", "PROMOTION_EXPIRED",
  "REFERRAL_SIGNUP", "REFERRAL_REWARD_GRANTED",
]);
export const notificationPriorityEnum = pgEnum("notification_priority", ["LOW", "NORMAL", "HIGH", "CRITICAL"]);
export const notificationChannelEnum = pgEnum("notification_channel", ["IN_APP", "REALTIME", "EMAIL", "WHATSAPP"]);
export const notificationDeliveryStatusEnum = pgEnum("notification_delivery_status", ["PENDING", "QUEUED", "SENDING", "SENT", "DELIVERED", "FAILED", "CANCELLED"]);
export const notificationSubjectTypeEnum = pgEnum("notification_subject_type", ["DEBT", "SCHEDULED_TRANSACTION", "BUDGET", "TRANSACTION", "SUBSCRIPTION", "NONE"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  timezone: text("timezone").notNull().default("UTC"),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("ARS"),
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  // Captured once at signup (better-auth additionalField, packages/auth) purely to funnel a
  // `?ref=` code through the sign-up request into AttributeReferral; not the source of truth for
  // "is this user attributed" — that's referral_attributions.referred_user_id. Never cleared or
  // recomputed after signup.
  signupReferralCode: text("signup_referral_code"),
  // Set by the onboarding basic-profile step (TASK-063) — real account configuration (like
  // timezone/baseCurrency above), not the optional/anonymous statistical-profile region bucket
  // (packages/privacy's user_statistical_profiles.region_code is a separate, privacy-governed
  // concept — never conflate the two).
  country: text("country"),
  language: text("language"),
  ...timestamps,
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  openingBalance: numeric("opening_balance", { precision: 20, scale: 6 }).notNull().default("0"),
  openingDate: date("opening_date").notNull(),
  status: accountStatusEnum("status").notNull().default("ACTIVE"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("accounts_user_idx").on(table.userId),
  index("accounts_user_status_idx").on(table.userId, table.status),
  check("accounts_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  type: categoryTypeEnum("type").notNull(),
  status: entityStatusEnum("status").notNull().default("ACTIVE"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("categories_user_idx").on(table.userId),
  index("categories_parent_idx").on(table.parentId),
]);

// Canonical, KNOWLEDGE-curated taxonomy. Users never edit this; it is the stable spine every
// aggregate metric and the classifier resolve against. `categories` (the free-text, per-user
// table) stays as-is — `category_map` bridges the two.
export const categoryTaxonomy = pgTable("category_taxonomy", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categoryTaxonomy.id, { onDelete: "restrict" }),
  level: taxonomyLevelEnum("level").notNull(),
  type: categoryTypeEnum("type").notNull(),
  slug: text("slug").notNull(),
  displayName: text("display_name").notNull(),
  mcc: varchar("mcc", { length: 4 }),
  sortOrder: integer("sort_order").notNull().default(0),
  version: integer("version").notNull().default(1),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [
  uniqueIndex("category_taxonomy_slug_unique").on(table.slug),
  index("category_taxonomy_parent_idx").on(table.parentId),
  index("category_taxonomy_type_level_idx").on(table.type, table.level),
]);

// Canonical merchant identities — one row per real business. Seeded and grown from imports and
// user corrections. `merchant_aliases` holds every raw string that resolves here.
export const merchants = pgTable("merchants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  canonicalName: text("canonical_name").notNull(),
  merchantGroupId: uuid("merchant_group_id").references((): AnyPgColumn => merchants.id, { onDelete: "set null" }),
  defaultTaxonomyNodeId: uuid("default_taxonomy_node_id").references(() => categoryTaxonomy.id, { onDelete: "set null" }),
  homeCountry: varchar("home_country", { length: 2 }),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [
  uniqueIndex("merchants_slug_unique").on(table.slug),
  index("merchants_group_idx").on(table.merchantGroupId),
]);

export const merchantAliases = pgTable("merchant_aliases", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  // Normalized lookup key (lower, unaccented, collapsed whitespace) for EXACT/PREFIX/CONTAINS;
  // a raw regex for REGEX.
  pattern: text("pattern").notNull(),
  matchType: merchantAliasMatchTypeEnum("match_type").notNull().default("EXACT"),
  source: merchantAliasSourceEnum("source").notNull().default("SEED"),
  addedByUserId: uuid("added_by_user_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => [
  uniqueIndex("merchant_aliases_public_pattern_type_unique")
    .on(table.pattern, table.matchType)
    .where(sql`${table.addedByUserId} is null`),
  uniqueIndex("merchant_aliases_user_pattern_type_unique")
    .on(table.addedByUserId, table.pattern, table.matchType)
    .where(sql`${table.addedByUserId} is not null`),
  index("merchant_aliases_merchant_idx").on(table.merchantId),
]);

export const categoryMap = pgTable("category_map", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  userCategoryId: uuid("user_category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  taxonomyNodeId: uuid("taxonomy_node_id").notNull().references(() => categoryTaxonomy.id, { onDelete: "restrict" }),
  source: categoryMapSourceEnum("source").notNull().default("MODEL"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("0.500"),
  ...timestamps,
}, (table) => [
  uniqueIndex("category_map_user_category_unique").on(table.userCategoryId),
  index("category_map_user_idx").on(table.userId),
  index("category_map_taxonomy_idx").on(table.taxonomyNodeId),
  check("category_map_confidence_range_check", sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
]);

// Per-user "this merchant means this category for me" override, learned when a user picks a
// category for a recognized merchant that differs from the merchant's global default.
// Consulted before `merchants.default_taxonomy_node_id` on capture — never writes it, so one
// user's corrections stay out of the global model. See merchant_user_default_source.
export const merchantUserDefaultSourceEnum = pgEnum("merchant_user_default_source", ["USER_EXPLICIT", "MODEL"]);

export const merchantUserDefaults = pgTable("merchant_user_defaults", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchantId: uuid("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  taxonomyNodeId: uuid("taxonomy_node_id").notNull().references(() => categoryTaxonomy.id, { onDelete: "restrict" }),
  source: merchantUserDefaultSourceEnum("source").notNull().default("USER_EXPLICIT"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("1.000"),
  ...timestamps,
}, (table) => [
  uniqueIndex("merchant_user_defaults_user_merchant_unique").on(table.userId, table.merchantId),
  index("merchant_user_defaults_merchant_idx").on(table.merchantId),
  check("merchant_user_defaults_confidence_range_check", sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
]);

// Explicit user-authored classification rules (spec §82). Always win over inferred
// categorization: evaluated at the top of the hierarchy in transaction-service, before any
// merchant default or progressive-trust logic. First active rule (by priority) that matches wins.
export const classificationRuleMatcherEnum = pgEnum("classification_rule_matcher", ["MERCHANT", "DESCRIPTION"]);
export const classificationRuleModeEnum = pgEnum("classification_rule_mode", ["CONTAINS", "EQUALS", "STARTS_WITH"]);

export const userClassificationRules = pgTable("user_classification_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matcher: classificationRuleMatcherEnum("matcher").notNull(),
  mode: classificationRuleModeEnum("mode").notNull().default("CONTAINS"),
  // Needle, stored lower-cased and trimmed; matched against the normalized merchant/description.
  pattern: text("pattern").notNull(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  priority: integer("priority").notNull().default(100),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [
  index("user_classification_rules_user_priority_idx").on(table.userId, table.priority),
  uniqueIndex("user_classification_rules_user_matcher_pattern_unique").on(table.userId, table.matcher, table.mode, table.pattern),
]);

// One row per file import (spec §38 ImportSession) — for the summary screen and history.
export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  source: text("source").notNull().default("csv"),
  filename: text("filename"),
  rowCount: integer("row_count").notNull(),
  importedCount: integer("imported_count").notNull(),
  skippedCount: integer("skipped_count").notNull(),
  failedCount: integer("failed_count").notNull(),
  // Idempotency key for the commit command (spec 14 §38: "imports tienen batch key y row
  // fingerprint"). Row-level dedup already exists (fingerprint scoring against existing
  // transactions); this covers the coarser case — a retried/double-submitted commit of the
  // same batch must resolve to the original result, not depend on the fingerprint heuristic
  // catching every row.
  commandId: uuid("command_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("import_batches_user_idx").on(table.userId, table.createdAt),
  uniqueIndex("import_batches_user_command_unique")
    .on(table.userId, table.commandId)
    .where(sql`${table.commandId} is not null`),
]);

// "These two transactions are NOT the same" — remembered so the /duplicados review screen
// stops re-surfacing a pair the user already looked at. pairKey = "<minId>:<maxId>".
export const duplicateDismissals = pgTable("duplicate_dismissals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pairKey: text("pair_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("duplicate_dismissals_user_pair_unique").on(table.userId, table.pairKey),
]);

export const transfers = pgTable("transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  fromAccountId: uuid("from_account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  toAccountId: uuid("to_account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  notes: text("notes"),
  // Idempotency key for the create command (spec 14 §38) — see the matching column on `transactions`.
  commandId: uuid("command_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("transfers_user_occurred_idx").on(table.userId, table.occurredAt),
  index("transfers_from_account_occurred_idx").on(table.fromAccountId, table.occurredAt),
  index("transfers_to_account_occurred_idx").on(table.toAccountId, table.occurredAt),
  uniqueIndex("transfers_user_command_unique")
    .on(table.userId, table.commandId)
    .where(sql`${table.commandId} is not null`),
  check("transfers_amount_positive_check", sql`${table.amount} > 0`),
  check("transfers_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
  check("transfers_different_accounts_check", sql`${table.fromAccountId} <> ${table.toAccountId}`),
]);

export const debts = pgTable("debts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  creditor: text("creditor"),
  type: debtTypeEnum("type").notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  originalAmount: numeric("original_amount", { precision: 20, scale: 6 }).notNull(),
  startDate: date("start_date").notNull(),
  status: debtStatusEnum("status").notNull().default("ACTIVE"),
  interestType: interestTypeEnum("interest_type").notNull().default("NO_INTEREST"),
  interestRate: numeric("interest_rate", { precision: 12, scale: 8 }),
  notes: text("notes"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("debts_user_status_idx").on(table.userId, table.status),
  index("debts_user_start_date_idx").on(table.userId, table.startDate),
  check("debts_original_amount_positive_check", sql`${table.originalAmount} > 0`),
  check("debts_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
  check("debts_interest_rate_non_negative_check", sql`${table.interestRate} is null or ${table.interestRate} >= 0`),
]);

export const debtInstallments = pgTable("debt_installments", {
  id: uuid("id").primaryKey().defaultRandom(),
  debtId: uuid("debt_id").notNull().references(() => debts.id, { onDelete: "restrict" }),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: date("due_date").notNull(),
  principalAmount: numeric("principal_amount", { precision: 20, scale: 6 }).notNull().default("0"),
  interestAmount: numeric("interest_amount", { precision: 20, scale: 6 }).notNull().default("0"),
  feeAmount: numeric("fee_amount", { precision: 20, scale: 6 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 20, scale: 6 }).notNull(),
  status: installmentStatusEnum("status").notNull().default("PENDING"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("debt_installments_debt_number_unique").on(table.debtId, table.installmentNumber),
  index("debt_installments_debt_due_idx").on(table.debtId, table.dueDate, table.installmentNumber),
  index("debt_installments_debt_status_due_idx").on(table.debtId, table.status, table.dueDate),
  check("debt_installments_number_positive_check", sql`${table.installmentNumber} > 0`),
  check("debt_installments_principal_non_negative_check", sql`${table.principalAmount} >= 0`),
  check("debt_installments_interest_non_negative_check", sql`${table.interestAmount} >= 0`),
  check("debt_installments_fee_non_negative_check", sql`${table.feeAmount} >= 0`),
  check("debt_installments_total_positive_check", sql`${table.totalAmount} > 0`),
  check("debt_installments_components_sum_check", sql`${table.principalAmount} + ${table.interestAmount} + ${table.feeAmount} = ${table.totalAmount}`),
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").notNull().default("POSTED"),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  description: text("description").notNull(),
  merchant: text("merchant"),
  merchantId: uuid("merchant_id").references(() => merchants.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }),
  // Denormalized canonical category (resolved from category_map at write time) so analytics
  // never has to join through the per-user categories table.
  taxonomyNodeId: uuid("taxonomy_node_id").references(() => categoryTaxonomy.id, { onDelete: "set null" }),
  paymentMethod: paymentMethodEnum("payment_method"),
  // How this row was classified: { categoryConfidence, merchantConfidence, method, reviewedByUser }.
  classification: jsonb("classification"),
  transferId: uuid("transfer_id").references(() => transfers.id, { onDelete: "restrict" }),
  scheduledTransactionId: uuid("scheduled_transaction_id"),
  // Idempotency key for the create command (spec 14 §38, Foundation §14). Client-generated,
  // one per capture-form instance; a retried submit carries the same value so the write is
  // applied at most once. NULL for rows created by paths that don't (yet) pass a key.
  commandId: uuid("command_id"),
  originalTransactionId: uuid("original_transaction_id").references((): AnyPgColumn => transactions.id, { onDelete: "restrict" }),
  relatedTransactionId: uuid("related_transaction_id").references((): AnyPgColumn => transactions.id, { onDelete: "restrict" }),
  reason: text("reason"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  source: transactionSourceEnum("source").notNull().default("MANUAL"),
  metadata: jsonb("metadata"),
  notes: text("notes"),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("transactions_user_occurred_idx").on(table.userId, table.occurredAt),
  index("transactions_account_occurred_idx").on(table.accountId, table.occurredAt),
  index("transactions_user_type_idx").on(table.userId, table.type),
  index("transactions_user_category_idx").on(table.userId, table.categoryId),
  index("transactions_original_transaction_idx").on(table.originalTransactionId),
  index("transactions_related_transaction_idx").on(table.relatedTransactionId),
  index("transactions_transfer_idx").on(table.transferId),
  uniqueIndex("transactions_scheduled_transaction_unique").on(table.scheduledTransactionId),
  uniqueIndex("transactions_user_command_unique")
    .on(table.userId, table.commandId)
    .where(sql`${table.commandId} is not null`),
  uniqueIndex("transactions_transfer_out_unique").on(table.transferId).where(sql`${table.type} = 'TRANSFER_OUT'`),
  uniqueIndex("transactions_transfer_in_unique").on(table.transferId).where(sql`${table.type} = 'TRANSFER_IN'`),
  check("transactions_transfer_metadata_check", sql`(${table.type} in ('TRANSFER_IN', 'TRANSFER_OUT') and ${table.source} = 'TRANSFER' and ${table.transferId} is not null and ${table.categoryId} is null) or (${table.type} not in ('TRANSFER_IN', 'TRANSFER_OUT'))`),
  check("transactions_amount_positive_check", sql`${table.amount} > 0`),
  check("transactions_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

export const debtPayments = pgTable("debt_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  debtId: uuid("debt_id").notNull().references(() => debts.id, { onDelete: "restrict" }),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
  transactionId: uuid("transaction_id").notNull().unique().references(() => transactions.id, { onDelete: "restrict" }),
  status: debtPaymentStatusEnum("status").notNull().default("POSTED"),
  notes: text("notes"),
  // Idempotency key for the record-payment command (spec 14 §38) — see `transactions.command_id`.
  commandId: uuid("command_id"),
  ...timestamps,
}, (table) => [
  index("debt_payments_debt_paid_idx").on(table.debtId, table.paidAt),
  uniqueIndex("debt_payments_user_command_unique")
    .on(table.userId, table.commandId)
    .where(sql`${table.commandId} is not null`),
  check("debt_payments_amount_positive_check", sql`${table.amount} > 0`),
  check("debt_payments_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

export const debtPaymentAllocations = pgTable("debt_payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => debtPayments.id, { onDelete: "restrict" }),
  installmentId: uuid("installment_id").notNull().references(() => debtInstallments.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("debt_payment_allocations_payment_installment_unique").on(table.paymentId, table.installmentId),
  index("debt_payment_allocations_installment_idx").on(table.installmentId),
  check("debt_payment_allocations_amount_positive_check", sql`${table.amount} > 0`),
]);

export const scheduledTransactions = pgTable("scheduled_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  type: transactionTypeEnum("type").notNull(),
  expectedAmount: numeric("expected_amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  description: text("description").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }),
  scheduledDate: date("scheduled_date").notNull(),
  status: scheduledTransactionStatusEnum("status").notNull().default("SCHEDULED"),
  source: scheduledTransactionSourceEnum("source").notNull().default("MANUAL"),
  recurringTransactionId: uuid("recurring_transaction_id"),
  occurrenceNumber: integer("occurrence_number"),
  actualAmount: numeric("actual_amount", { precision: 20, scale: 6 }),
  actualOccurredAt: timestamp("actual_occurred_at", { withTimezone: true }),
  postedTransactionId: uuid("posted_transaction_id").unique().references(() => transactions.id, { onDelete: "restrict" }),
  notes: text("notes"),
  ...timestamps,
}, (table) => [
  index("scheduled_transactions_user_date_status_idx").on(table.userId, table.scheduledDate, table.status),
  index("scheduled_transactions_account_date_idx").on(table.accountId, table.scheduledDate),
  uniqueIndex("scheduled_transactions_recurring_date_unique").on(table.recurringTransactionId, table.scheduledDate),
  check("scheduled_transactions_expected_amount_positive_check", sql`${table.expectedAmount} > 0`),
  check("scheduled_transactions_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
  check("scheduled_transactions_type_check", sql`${table.type} in ('INCOME', 'EXPENSE')`),
]);

export const recurringTransactions = pgTable("recurring_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  description: text("description").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }),
  frequency: recurringTransactionFrequencyEnum("frequency").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  occurrenceCount: integer("occurrence_count"),
  anchorDay: integer("anchor_day"),
  nextOccurrence: date("next_occurrence"),
  status: recurringTransactionStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  ...timestamps,
}, (table) => [
  index("recurring_transactions_user_status_idx").on(table.userId, table.status),
  index("recurring_transactions_user_next_idx").on(table.userId, table.nextOccurrence),
  check("recurring_transactions_amount_positive_check", sql`${table.amount} > 0`),
  check("recurring_transactions_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
  check("recurring_transactions_occurrence_count_check", sql`${table.occurrenceCount} is null or ${table.occurrenceCount} > 0`),
  check("recurring_transactions_anchor_day_check", sql`${table.anchorDay} is null or (${table.anchorDay} >= 1 and ${table.anchorDay} <= 31)`),
  check("recurring_transactions_end_date_check", sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`),
  check("recurring_transactions_type_check", sql`${table.type} in ('INCOME', 'EXPENSE')`),
]);

// Recurring expense patterns DETECTED from transaction history (spec §15) — distinct from
// `recurring_transactions`, which are user-authored schedules. One row per (user, group, currency);
// surfaced as SUGGESTED for the user to CONFIRM or DISMISS. Re-run detection never resurrects a
// DISMISSED series or overwrites a CONFIRMED one.
export const recurringSeriesStatusEnum = pgEnum("recurring_series_status", ["SUGGESTED", "CONFIRMED", "DISMISSED"]);

export const recurringSeries = pgTable("recurring_series", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchantId: uuid("merchant_id").references(() => merchants.id, { onDelete: "set null" }),
  // Stable grouping key: "m:<merchantId>" or "d:<normalized description>" when there's no merchant.
  groupKey: text("group_key").notNull(),
  label: text("label").notNull(),
  frequency: recurringTransactionFrequencyEnum("frequency").notNull(),
  typicalAmount: numeric("typical_amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  occurrenceCount: integer("occurrence_count").notNull(),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
  lastSeenOn: date("last_seen_on").notNull(),
  nextExpectedOn: date("next_expected_on").notNull(),
  status: recurringSeriesStatusEnum("status").notNull().default("SUGGESTED"),
  ...timestamps,
}, (table) => [
  uniqueIndex("recurring_series_user_group_currency_unique").on(table.userId, table.groupKey, table.currencyCode),
  index("recurring_series_user_status_idx").on(table.userId, table.status),
  check("recurring_series_confidence_range_check", sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
  check("recurring_series_typical_amount_positive_check", sql`${table.typicalAmount} > 0`),
]);

// Subscriptions (spec §16) — merchant-based recurring charges at a monthly/yearly cadence,
// with price history so a price hike can be surfaced ("Netflix subió $3.500/mes"). Detected
// from transactions; a DISMISSED row is never re-created, an INACTIVE one means "no charge
// for a while" (likely cancelled) but the history is kept.
export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "INACTIVE", "DISMISSED"]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchantId: uuid("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  frequency: recurringTransactionFrequencyEnum("frequency").notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 20, scale: 6 }).notNull(),
  // Oldest→newest: [{ amount: "18499.00", from: "2025-01-04" }, …]
  priceHistory: jsonb("price_history").$type<Array<{ amount: string; from: string }>>().notNull().default(sql`'[]'::jsonb`),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  firstChargedOn: date("first_charged_on").notNull(),
  lastChargedOn: date("last_charged_on").notNull(),
  nextExpectedOn: date("next_expected_on").notNull(),
  chargeCount: integer("charge_count").notNull(),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
  status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
  ...timestamps,
}, (table) => [
  uniqueIndex("subscriptions_user_merchant_currency_unique").on(table.userId, table.merchantId, table.currencyCode),
  index("subscriptions_user_status_idx").on(table.userId, table.status),
  check("subscriptions_current_amount_positive_check", sql`${table.currentAmount} > 0`),
  check("subscriptions_confidence_range_check", sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
]);

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  name: text("name"),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  period: budgetPeriodEnum("period").notNull().default("MONTHLY"),
  limitAmount: numeric("limit_amount", { precision: 20, scale: 6 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  rollover: boolean("rollover").notNull().default(false),
  status: entityStatusEnum("status").notNull().default("ACTIVE"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("budgets_user_status_idx").on(table.userId, table.status),
  index("budgets_user_category_status_idx").on(table.userId, table.categoryId, table.status),
  index("budgets_user_currency_status_idx").on(table.userId, table.currencyCode, table.status),
  uniqueIndex("budgets_user_category_currency_period_active_unique")
    .on(table.userId, table.categoryId, table.currencyCode, table.period)
    .where(sql`${table.status} = 'ACTIVE'`),
  check("budgets_limit_amount_positive_check", sql`${table.limitAmount} > 0`),
  check("budgets_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
  check("budgets_end_date_check", sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`),
]);

export const budgetAlerts = pgTable("budget_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  budgetId: uuid("budget_id").notNull().references(() => budgets.id, { onDelete: "restrict" }),
  periodKey: varchar("period_key", { length: 7 }).notNull(),
  alertType: budgetAlertTypeEnum("alert_type").notNull(),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("budget_alerts_budget_period_type_unique").on(table.budgetId, table.periodKey, table.alertType),
  index("budget_alerts_user_period_idx").on(table.userId, table.periodKey),
]);

export const goalCategoryEnum = pgEnum("goal_category", [
  "EMERGENCY_FUND",
  "TRAVEL",
  "VEHICLE",
  "HOME",
  "EDUCATION",
  "PURCHASE",
  "INVESTMENT",
  "OTHER",
]);
export const goalStatusEnum = pgEnum("goal_status", ["ACTIVE", "COMPLETED", "ARCHIVED"]);

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  category: goalCategoryEnum("category").notNull().default("OTHER"),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 20, scale: 6 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 20, scale: 6 }).notNull().default("0"),
  targetDate: date("target_date"),
  status: goalStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("goals_user_status_idx").on(table.userId, table.status),
  check("goals_target_amount_positive_check", sql`${table.targetAmount} > 0`),
  check("goals_current_amount_nonneg_check", sql`${table.currentAmount} >= 0`),
  check("goals_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

// WP-GOALS-ALLOC (spec 07 §6.2 / §15 / §16). A goal's progress is the sum of explicit
// allocations, never a number the user or a caller sets directly:
//   currentAmount = Σ (INITIAL + CONTRIBUTION).amount − Σ WITHDRAWAL.amount
// `goals.current_amount` stays as a cache, recomputed in the same transaction as every
// allocation write and guarded by `checkGoalAllocationConsistency` in finance:audit.
// An allocation is an assignment to the goal — it never posts to the ledger (§15.1, CM-08).
// `relatedTransactionId` is optional evidence that money moved (a transfer, §16.1); the
// allocation's semantics don't depend on it.
export const goalAllocationKindEnum = pgEnum("goal_allocation_kind", ["INITIAL", "CONTRIBUTION", "WITHDRAWAL"]);

export const goalAllocations = pgTable("goal_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  kind: goalAllocationKindEnum("kind").notNull(),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  occurredOn: date("occurred_on").notNull(),
  note: text("note"),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  relatedTransactionId: uuid("related_transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => [
  index("goal_allocations_goal_idx").on(table.goalId, table.occurredOn),
  index("goal_allocations_user_idx").on(table.userId),
  check("goal_allocations_amount_positive_check", sql`${table.amount} > 0`),
  check("goal_allocations_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

// WP-INSIGHT-DETECTORS (spec 09 §9/§17/§18) — persisted so insights have a lifecycle,
// history, cooldown and dedupe. One row per (user, dedupeKey) "condition"; the detector
// engine upserts it. `evidence` is the structured InsightEvidence the copy is derived from.
export const insightFamilyEnum = pgEnum("insight_family", [
  "INS-SPEND-DELTA",
  "INS-SPEND-PACE",
  "INS-BUDGET-LIMIT",
  "INS-CASH-RISK",
  "INS-OBL-DUE",
  "INS-REC-AMOUNT",
  "INS-REC-DETECT",
  "INS-ANOMALY-AMOUNT",
  "INS-GOAL-PACE",
  "INS-DATA-QUALITY",
]);
export const insightStatusEnum = pgEnum("insight_status", [
  "DETECTED",
  "ACTIVE",
  "SEEN",
  "DISMISSED",
  "RESOLVED",
  "EXPIRED",
  "SUPERSEDED",
  "INVALIDATED",
]);
export const insightConfidenceEnum = pgEnum("insight_confidence", ["LOW", "MEDIUM", "HIGH"]);
export const insightFeedbackEnum = pgEnum("insight_feedback", [
  "USEFUL",
  "NOT_USEFUL",
  "NOT_APPLICABLE",
  "ALREADY_KNEW",
  "WRONG_DATA",
]);

export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  family: insightFamilyEnum("family").notNull(),
  dedupeKey: text("dedupe_key").notNull(),
  status: insightStatusEnum("status").notNull().default("ACTIVE"),
  confidence: insightConfidenceEnum("confidence").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  impactAmount: numeric("impact_amount", { precision: 20, scale: 6 }),
  impactCurrency: varchar("impact_currency", { length: 3 }),
  ctaLabel: text("cta_label"),
  ctaHref: text("cta_href"),
  evidence: jsonb("evidence").notNull(),
  calculationVersion: text("calculation_version").notNull(),
  feedback: insightFeedbackEnum("feedback"),
  supersededById: uuid("superseded_by_id"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("insights_user_dedupe_unique").on(table.userId, table.dedupeKey),
  index("insights_user_status_idx").on(table.userId, table.status),
  check("insights_impact_currency_pairing_check", sql`(${table.impactAmount} is null) = (${table.impactCurrency} is null)`),
]);

// One-tap capture shortcuts. Some created by the user ("Guardar como acción rápida" on a
// transaction), some auto-created from repeated shapes. `amountHints` holds the last few amounts
// used for this template so the UI can offer quick-amount chips.
export const quickTemplates = pgTable("quick_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  label: text("label").notNull(),
  type: categoryTypeEnum("type").notNull(),
  description: text("description").notNull(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  merchantText: text("merchant_text"),
  amountHints: jsonb("amount_hints").notNull().default(sql`'[]'::jsonb`),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("quick_templates_user_idx").on(table.userId, table.usageCount),
]);

export const billingPlans = pgTable("billing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  billingInterval: billingIntervalEnum("billing_interval").notNull().default("MONTHLY"),
  provider: billingProviderEnum("provider").notNull().default("MERCADO_PAGO"),
  providerPlanId: text("provider_plan_id"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [
  uniqueIndex("billing_plans_code_unique").on(table.code),
  index("billing_plans_active_idx").on(table.active),
  check("billing_plans_price_positive_check", sql`${table.price} > 0`),
  check("billing_plans_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

export const billingSubscriptions = pgTable("billing_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  planId: uuid("plan_id").notNull().references(() => billingPlans.id, { onDelete: "restrict" }),
  provider: billingProviderEnum("provider").notNull().default("MERCADO_PAGO"),
  providerSubscriptionId: text("provider_subscription_id"),
  providerPayloadVersion: text("provider_payload_version"),
  status: billingSubscriptionStatusEnum("status").notNull().default("PENDING"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  // Optional, never blocking (docs/10-6.subscription-cancellation-refunds.md §82): captured
  // separately from provider state, purely for churn analytics.
  cancellationReasonCode: text("cancellation_reason_code"),
  cancellationReasonComment: text("cancellation_reason_comment"),
  ...timestamps,
}, (table) => [
  index("billing_subscriptions_user_idx").on(table.userId),
  index("billing_subscriptions_status_idx").on(table.status),
  uniqueIndex("billing_subscriptions_provider_subscription_unique")
    .on(table.providerSubscriptionId)
    .where(sql`${table.providerSubscriptionId} is not null`),
  uniqueIndex("billing_subscriptions_user_effective_unique")
    .on(table.userId)
    .where(sql`${table.status} in ('PENDING', 'ACTIVE', 'PAST_DUE')`),
  check("billing_subscriptions_period_check", sql`${table.currentPeriodEnd} is null or ${table.currentPeriodStart} is null or ${table.currentPeriodEnd} > ${table.currentPeriodStart}`),
]);

export const billingPeriods = pgTable("billing_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").notNull().references(() => billingSubscriptions.id, { onDelete: "restrict" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: billingPeriodStatusEnum("status").notNull().default("PENDING"),
  providerReference: text("provider_reference"),
  ...timestamps,
}, (table) => [
  uniqueIndex("billing_periods_subscription_range_unique").on(table.subscriptionId, table.startsAt, table.endsAt),
  index("billing_periods_subscription_idx").on(table.subscriptionId),
  index("billing_periods_range_idx").on(table.startsAt, table.endsAt),
  check("billing_periods_range_check", sql`${table.endsAt} > ${table.startsAt}`),
]);

export const billingPayments = pgTable("billing_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  subscriptionId: uuid("subscription_id").notNull().references(() => billingSubscriptions.id, { onDelete: "restrict" }),
  billingPeriodId: uuid("billing_period_id").references(() => billingPeriods.id, { onDelete: "restrict" }),
  providerPaymentId: text("provider_payment_id"),
  status: billingPaymentStatusEnum("status").notNull().default("PENDING"),
  grossAmount: numeric("gross_amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  providerFee: numeric("provider_fee", { precision: 20, scale: 6 }),
  netAmount: numeric("net_amount", { precision: 20, scale: 6 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("billing_payments_user_idx").on(table.userId),
  index("billing_payments_subscription_idx").on(table.subscriptionId),
  uniqueIndex("billing_payments_provider_payment_unique")
    .on(table.providerPaymentId)
    .where(sql`${table.providerPaymentId} is not null`),
  check("billing_payments_gross_amount_positive_check", sql`${table.grossAmount} > 0`),
  check("billing_payments_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

export const billingWebhookEvents = pgTable("billing_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: billingProviderEnum("provider").notNull().default("MERCADO_PAGO"),
  providerEventId: text("provider_event_id"),
  eventType: text("event_type").notNull(),
  externalResourceId: text("external_resource_id"),
  payloadHash: text("payload_hash").notNull(),
  status: billingWebhookEventStatusEnum("status").notNull().default("RECEIVED"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  errorCode: text("error_code"),
}, (table) => [
  uniqueIndex("billing_webhook_events_provider_event_unique")
    .on(table.provider, table.providerEventId)
    .where(sql`${table.providerEventId} is not null`),
  index("billing_webhook_events_provider_hash_idx").on(table.provider, table.payloadHash),
  index("billing_webhook_events_status_idx").on(table.status),
]);

export const billingRefunds = pgTable("billing_refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => billingPayments.id, { onDelete: "restrict" }),
  providerRefundId: text("provider_refund_id"),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  reason: billingRefundReasonEnum("reason").notNull(),
  status: billingRefundStatusEnum("status").notNull().default("PENDING"),
  requestedBy: uuid("requested_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  // TASK-058 Implementation Notes: idempotency key persisted independently of any provider-level
  // idempotency support, so a retried admin request never issues a second provider refund even if
  // the first attempt's provider call is still in flight or its result was never observed.
  requestIdempotencyKey: text("request_idempotency_key").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  ...timestamps,
}, (table) => [
  index("billing_refunds_payment_idx").on(table.paymentId),
  index("billing_refunds_status_idx").on(table.status),
  uniqueIndex("billing_refunds_idempotency_key_unique").on(table.requestIdempotencyKey),
  uniqueIndex("billing_refunds_provider_refund_unique")
    .on(table.providerRefundId)
    .where(sql`${table.providerRefundId} is not null`),
  check("billing_refunds_amount_positive_check", sql`${table.amount} > 0`),
  check("billing_refunds_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

export const billingDisputes = pgTable("billing_disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => billingPayments.id, { onDelete: "restrict" }),
  providerDisputeId: text("provider_dispute_id"),
  type: text("type").notNull(),
  status: billingDisputeStatusEnum("status").notNull().default("OPEN"),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("billing_disputes_payment_idx").on(table.paymentId),
  index("billing_disputes_status_idx").on(table.status),
  uniqueIndex("billing_disputes_provider_dispute_unique")
    .on(table.providerDisputeId)
    .where(sql`${table.providerDisputeId} is not null`),
  check("billing_disputes_amount_positive_check", sql`${table.amount} > 0`),
  check("billing_disputes_currency_code_length_check", sql`char_length(${table.currencyCode}) = 3`),
]);

export const promotionCodes = pgTable("promotion_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  normalizedCode: text("normalized_code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: promotionCodeStatusEnum("status").notNull().default("DRAFT"),
  accessLevel: text("access_level").notNull().default("PRO"),
  durationValue: integer("duration_value").notNull(),
  durationUnit: promotionDurationUnitEnum("duration_unit").notNull().default("DAYS"),
  redemptionStartsAt: timestamp("redemption_starts_at", { withTimezone: true }),
  redemptionEndsAt: timestamp("redemption_ends_at", { withTimezone: true }),
  // Nullable = unlimited global redemptions.
  maxRedemptions: integer("max_redemptions"),
  maxRedemptionsPerUser: integer("max_redemptions_per_user").notNull().default(1),
  stackingPolicy: promotionStackingPolicyEnum("stacking_policy").notNull().default("NOT_STACKABLE"),
  aiCreditsPerPeriod: integer("ai_credits_per_period").notNull().default(0),
  whatsappMessagesPerPeriod: integer("whatsapp_messages_per_period").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  // Denormalized counter, updated in the same transaction as each redemption insert while the
  // code row is locked (`SELECT ... FOR UPDATE`) — this is what makes `max_redemptions`
  // enforcement atomic under concurrency, not a `COUNT(*)` over `promotion_redemptions`.
  redemptionCount: integer("redemption_count").notNull().default(0),
  ...timestamps,
}, (table) => [
  uniqueIndex("promotion_codes_normalized_code_unique").on(table.normalizedCode),
  index("promotion_codes_status_idx").on(table.status),
  check("promotion_codes_duration_value_positive_check", sql`${table.durationValue} > 0`),
  check("promotion_codes_max_redemptions_positive_check", sql`${table.maxRedemptions} is null or ${table.maxRedemptions} > 0`),
  check("promotion_codes_max_redemptions_per_user_positive_check", sql`${table.maxRedemptionsPerUser} > 0`),
  check("promotion_codes_redemption_window_check", sql`${table.redemptionStartsAt} is null or ${table.redemptionEndsAt} is null or ${table.redemptionEndsAt} > ${table.redemptionStartsAt}`),
]);

export const promotionRedemptions = pgTable("promotion_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  promotionCodeId: uuid("promotion_code_id").notNull().references(() => promotionCodes.id, { onDelete: "restrict" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: promotionRedemptionStatusEnum("status").notNull().default("REDEEMED"),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  // Forward reference: promotional_access_grants is declared below and references this table
  // back via redemption_id — both FKs are added by drizzle-kit via ALTER TABLE after both tables
  // exist, so the mutual reference is safe.
  grantId: uuid("grant_id").references((): AnyPgColumn => promotionalAccessGrants.id, { onDelete: "restrict" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("promotion_redemptions_promotion_code_idx").on(table.promotionCodeId),
  index("promotion_redemptions_user_idx").on(table.userId),
]);

export const promotionalAccessGrants = pgTable("promotional_access_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  promotionCodeId: uuid("promotion_code_id").references(() => promotionCodes.id, { onDelete: "restrict" }),
  redemptionId: uuid("redemption_id").references(() => promotionRedemptions.id, { onDelete: "restrict" }),
  accessLevel: text("access_level").notNull().default("PRO"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: promotionalAccessGrantStatusEnum("status").notNull().default("ACTIVE"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedBy: uuid("revoked_by").references(() => users.id, { onDelete: "set null" }),
  revocationReason: text("revocation_reason"),
  source: promotionalAccessGrantSourceEnum("source").notNull(),
  // Snapshot of the code's terms at redemption time (task's Domain Rules: "editing a code never
  // modifies existing grants") — never re-read from promotion_codes after creation.
  aiCreditsPerPeriod: integer("ai_credits_per_period").notNull().default(0),
  whatsappMessagesPerPeriod: integer("whatsapp_messages_per_period").notNull().default(0),
  ...timestamps,
}, (table) => [
  index("promotional_access_grants_user_idx").on(table.userId),
  index("promotional_access_grants_ends_at_idx").on(table.endsAt),
  // A user can have at most one ACTIVE promotional grant at a time (V1: NOT_STACKABLE only) —
  // enforced here as the concurrency backstop behind the application-level PROMOTION_ALREADY_ACTIVE
  // check.
  uniqueIndex("promotional_access_grants_user_active_unique")
    .on(table.userId)
    .where(sql`${table.status} = 'ACTIVE'`),
  check("promotional_access_grants_period_check", sql`${table.endsAt} > ${table.startsAt}`),
]);

export const promotionAccessPeriods = pgTable("promotion_access_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  grantId: uuid("grant_id").notNull().references(() => promotionalAccessGrants.id, { onDelete: "restrict" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  sequence: integer("sequence").notNull(),
  status: promotionAccessPeriodStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("promotion_access_periods_grant_idx").on(table.grantId),
  uniqueIndex("promotion_access_periods_grant_sequence_unique").on(table.grantId, table.sequence),
  check("promotion_access_periods_range_check", sql`${table.endsAt} > ${table.startsAt}`),
]);

export const adminRoleEnum = pgEnum("admin_role", ["SUPPORT", "ADMIN", "SUPER_ADMIN"]);

// Deliberately a separate table, not a column on `users`: the vast majority of users are never
// admins, and admin role assignment is a sensitive, rarely-changed fact that shouldn't live on
// the same row Better Auth manages for every end user (TASK-059: "no shared admin accounts").
export const adminRoles = pgTable("admin_roles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "restrict" }),
  role: adminRoleEnum("role").notNull(),
  grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "restrict" }),
  beforeSnapshot: jsonb("before_snapshot"),
  afterSnapshot: jsonb("after_snapshot"),
  reason: text("reason"),
  // No updatedAt — append-only by design (Domain Rule: "never editable from the UI"); no
  // repository method in packages/db ever issues an UPDATE or DELETE against this table.
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_log_actor_idx").on(table.actorUserId),
  index("audit_log_target_idx").on(table.targetUserId),
  index("audit_log_entity_idx").on(table.entityType, table.entityId),
  index("audit_log_created_at_idx").on(table.createdAt),
]);

export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  // At most one code per user — generated automatically, never derived from PII (Scope).
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  // Stored already-normalized (uppercase) at generation time, same convention as
  // promotion_codes.normalized_code, so uniqueness is a plain column index, not an expression one.
  code: text("code").notNull(),
  status: referralCodeStatusEnum("status").notNull().default("ACTIVE"),
  ...timestamps,
}, (table) => [
  uniqueIndex("referral_codes_owner_unique").on(table.ownerUserId),
  uniqueIndex("referral_codes_code_unique").on(table.code),
]);

export const referralAttributions = pgTable("referral_attributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralCodeId: uuid("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "restrict" }),
  referrerUserId: uuid("referrer_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  referredUserId: uuid("referred_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: referralAttributionStatusEnum("status").notNull().default("ATTRIBUTED"),
  attributedAt: timestamp("attributed_at", { withTimezone: true }).notNull().defaultNow(),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
  invalidatedBy: uuid("invalidated_by").references(() => users.id, { onDelete: "set null" }),
  invalidationReason: text("invalidation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // One attribution per referred user, ever — frozen permanently at creation (Domain Rule).
  uniqueIndex("referral_attributions_referred_user_unique").on(table.referredUserId),
  index("referral_attributions_referrer_idx").on(table.referrerUserId),
  check("referral_attributions_no_self_referral_check", sql`${table.referrerUserId} <> ${table.referredUserId}`),
]);

export const referralRewards = pgTable("referral_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralAttributionId: uuid("referral_attribution_id").notNull().references(() => referralAttributions.id, { onDelete: "restrict" }),
  beneficiaryUserId: uuid("beneficiary_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  qualificationEvent: referralQualificationEventEnum("qualification_event").notNull().default("FIRST_PAID_PRO_ACTIVATION"),
  type: referralRewardTypeEnum("type").notNull(),
  value: integer("value").notNull(),
  status: referralRewardStatusEnum("status").notNull().default("PENDING"),
  rewardPolicyVersion: text("reward_policy_version").notNull(),
  grantReferenceId: text("grant_reference_id"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  grantedAt: timestamp("granted_at", { withTimezone: true }),
}, (table) => [
  // Idempotency key (Domain Rule): a repeated qualifying event for the same attribution can
  // never produce a second reward for the same beneficiary.
  uniqueIndex("referral_rewards_attribution_event_beneficiary_unique").on(table.referralAttributionId, table.qualificationEvent, table.beneficiaryUserId),
  index("referral_rewards_beneficiary_idx").on(table.beneficiaryUserId),
  check("referral_rewards_value_positive_check", sql`${table.value} > 0`),
]);

export const aiCreditEntries = pgTable("ai_credit_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  type: aiCreditEntryTypeEnum("type").notNull(),
  pool: aiCreditPoolEnum("pool").notNull(),
  // Credits are whole-number product units, not Money — always stored positive; direction
  // (credit vs debit) is derived from `type` (docs/08.1-ai-credits-and-usage.md §27).
  amount: integer("amount").notNull(),
  capability: text("capability"),
  referenceId: text("reference_id"),
  periodKey: text("period_key"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("ai_credit_entries_user_pool_idx").on(table.userId, table.pool),
  index("ai_credit_entries_user_type_idx").on(table.userId, table.type),
  // One TRIAL_GRANT ever per user.
  uniqueIndex("ai_credit_entries_trial_grant_unique")
    .on(table.userId)
    .where(sql`${table.type} = 'TRIAL_GRANT'`),
  // One PLAN_GRANT per (user, billing period) — referenceId carries the billing period id.
  uniqueIndex("ai_credit_entries_plan_grant_unique")
    .on(table.userId, table.referenceId)
    .where(sql`${table.type} = 'PLAN_GRANT'`),
  // One REFERRAL_REWARD_GRANT per (user, referral reward) — referenceId carries the
  // referral_rewards.id, so a repeated grant attempt (e.g. RetryReferralReward called twice) can
  // never double-credit the same reward. This index's migration must be applied in a separate
  // `db:migrate` run from the one that adds the REFERRAL_REWARD_GRANT enum label (see
  // packages/db/drizzle/0022_referral_reward_grant_index.sql and TASK-055's Notes) — Postgres
  // forbids using a just-added, not-yet-committed enum label in the SAME transaction (SQLSTATE
  // 55P04), and casting the column to text to dodge that hits a second restriction ("functions in
  // index predicate must be marked IMMUTABLE", since enum-to-text output is only STABLE).
  uniqueIndex("ai_credit_entries_referral_reward_grant_unique")
    .on(table.userId, table.referenceId)
    .where(sql`${table.type} = 'REFERRAL_REWARD_GRANT'`),
  check("ai_credit_entries_amount_positive_check", sql`${table.amount} > 0`),
]);

export const aiCreditReservations = pgTable("ai_credit_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  capability: text("capability").notNull(),
  pool: aiCreditPoolEnum("pool").notNull(),
  credits: integer("credits").notNull(),
  operationId: text("operation_id").notNull(),
  status: aiCreditReservationStatusEnum("status").notNull().default("PENDING"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  creditEntryId: uuid("credit_entry_id").references(() => aiCreditEntries.id, { onDelete: "restrict" }),
  ...timestamps,
}, (table) => [
  uniqueIndex("ai_credit_reservations_operation_unique").on(table.operationId),
  index("ai_credit_reservations_user_status_idx").on(table.userId, table.status),
  index("ai_credit_reservations_status_expires_idx").on(table.status, table.expiresAt),
  check("ai_credit_reservations_credits_positive_check", sql`${table.credits} > 0`),
]);

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  sourceType: reminderSourceTypeEnum("source_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  preset: reminderPresetEnum("preset").notNull(),
  channel: reminderChannelEnum("channel").notNull().default("IN_APP"),
  timezone: text("timezone").notNull(),
  localDate: date("local_date").notNull(),
  localTime: varchar("local_time", { length: 5 }).notNull().default("09:00"),
  remindAt: timestamp("remind_at", { withTimezone: true }).notNull(),
  dedupKey: text("dedup_key").notNull(),
  status: reminderStatusEnum("status").notNull().default("PENDING"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("reminders_user_dedup_unique").on(table.userId, table.dedupKey),
  index("reminders_user_remind_status_idx").on(table.userId, table.remindAt, table.status),
  index("reminders_user_source_idx").on(table.userId, table.sourceType, table.sourceId),
  check("reminders_local_time_check", sql`${table.localTime} ~ '^[0-2][0-9]:[0-5][0-9]$'`),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  type: notificationTypeEnum("type").notNull(),
  category: notificationCategoryEnum("category").notNull(),
  priority: notificationPriorityEnum("priority").notNull().default("NORMAL"),
  titleKey: text("title_key").notNull(),
  bodyKey: text("body_key").notNull(),
  subjectType: notificationSubjectTypeEnum("subject_type").notNull().default("NONE"),
  subjectId: uuid("subject_id"),
  metadata: jsonb("metadata"),
  // Idempotency for a given event/window (docs/09-notifications-alerts.md §73-75) — e.g.
  // `${type}:${subjectId}:${windowKey}`. Nullable: not every notification needs deduplication.
  dedupKey: text("dedup_key"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("notifications_user_dedup_unique").on(table.userId, table.dedupKey).where(sql`${table.dedupKey} is not null`),
  index("notifications_user_created_idx").on(table.userId, table.createdAt),
  index("notifications_user_read_idx").on(table.userId, table.readAt),
  index("notifications_user_subject_idx").on(table.userId, table.subjectType, table.subjectId),
]);

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  notificationId: uuid("notification_id").notNull().references(() => notifications.id, { onDelete: "restrict" }),
  channel: notificationChannelEnum("channel").notNull(),
  status: notificationDeliveryStatusEnum("status").notNull().default("PENDING"),
  provider: text("provider"),
  providerMessageId: text("provider_message_id"),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastErrorCode: text("last_error_code"),
  queuedAt: timestamp("queued_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("notification_deliveries_notification_idx").on(table.notificationId),
  index("notification_deliveries_status_idx").on(table.status),
  check("notification_deliveries_attempt_count_check", sql`${table.attemptCount} >= 0`),
]);

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  // NULL = a global default for this channel across every notification type; a concrete value
  // overrides that default for one type only (docs/09-notifications-alerts.md §22-25).
  notificationType: notificationTypeEnum("notification_type"),
  channel: notificationChannelEnum("channel").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  leadTimeMinutes: integer("lead_time_minutes"),
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(false),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }),
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }),
  ...timestamps,
}, (table) => [
  uniqueIndex("notification_preferences_user_global_unique").on(table.userId, table.channel).where(sql`${table.notificationType} is null`),
  uniqueIndex("notification_preferences_user_type_unique").on(table.userId, table.notificationType, table.channel).where(sql`${table.notificationType} is not null`),
  check("notification_preferences_quiet_hours_start_check", sql`${table.quietHoursStart} is null or ${table.quietHoursStart} ~ '^[0-2][0-9]:[0-5][0-9]$'`),
  check("notification_preferences_quiet_hours_end_check", sql`${table.quietHoursEnd} is null or ${table.quietHoursEnd} ~ '^[0-2][0-9]:[0-5][0-9]$'`),
]);

export const notificationWhatsappConsent = pgTable("notification_whatsapp_consent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  // E.164 (docs/09-notifications-alerts.md §27) — e.g. "+5491122334455".
  phoneNumber: text("phone_number"),
  optInAt: timestamp("opt_in_at", { withTimezone: true }),
  optOutAt: timestamp("opt_out_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("notification_whatsapp_consent_user_unique").on(table.userId),
  check("notification_whatsapp_consent_phone_format_check", sql`${table.phoneNumber} is null or ${table.phoneNumber} ~ '^\\+[1-9][0-9]{6,14}$'`),
]);

export const sessions = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
}, (table) => [
  uniqueIndex("session_token_unique").on(table.token),
  index("session_user_idx").on(table.userId),
]);

export const authAccounts = pgTable("account", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  ...timestamps,
}, (table) => [
  index("account_user_idx").on(table.userId),
  uniqueIndex("account_provider_account_unique").on(table.providerId, table.accountId),
]);

export const verifications = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
}, (table) => [
  index("verification_identifier_idx").on(table.identifier),
]);

// The MVP-chosen AnalyticsProvider (packages/analytics' AnalyticsProvider port, implemented
// against this table) — eventName/environment are deliberately plain text, not pgEnum: the MVP
// event set is expected to grow, and this session hit real Postgres transaction-ordering
// pitfalls adding new enum labels (see TASK-055's Notes); a free-text column validated at the
// application layer by the Zod-backed event registry avoids that class of migration entirely.
export const analyticsEventLog = pgTable("analytics_event_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Null for non-critical events (view/interaction signals) — only critical, exactly-once
  // business events require one (packages/analytics' AnalyticsService.track()).
  eventId: text("event_id"),
  eventName: text("event_name").notNull(),
  eventVersion: integer("event_version").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  environment: text("environment").notNull(),
  internal: boolean("internal").notNull().default(false),
  properties: jsonb("properties").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("analytics_event_log_event_id_unique").on(table.eventId).where(sql`${table.eventId} is not null`),
  index("analytics_event_log_name_occurred_idx").on(table.eventName, table.occurredAt),
  index("analytics_event_log_user_idx").on(table.userId),
]);

// user_statistical_profiles / analytics_consents / consent history / cohort metrics
// (packages/privacy) — every categorical field is TEXT, not pgEnum, validated at the
// application layer by packages/privacy's Zod schemas, for the same reason as
// analytics_event_log above (avoids the enum-ADD-VALUE migration-ordering pitfalls this session
// hit repeatedly). All statistical-profile fields are nullable — Domain Rule: "Statistical
// Profile != Core Product Requirement," never required to use the product.
export const userStatisticalProfiles = pgTable("user_statistical_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "restrict" }),
  ageRange: text("age_range"),
  employmentStatus: text("employment_status"),
  incomeRange: text("income_range"),
  householdSizeRange: text("household_size_range"),
  regionCode: text("region_code"),
  // Set the first time the progressive completion prompt is shown/skipped, independent of
  // whether any field above was ever filled — the prompt is only ever offered once
  // (Scope: "progressive, skippable... after the user has already received value").
  promptDismissedAt: timestamp("prompt_dismissed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsConsents = pgTable("analytics_consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  purpose: text("purpose").notNull(),
  status: text("status").notNull(),
  policyVersion: text("policy_version").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // One current consent row per (user, purpose) — status/timestamps are updated in place;
  // analytics_consent_history is where every transition is preserved.
  uniqueIndex("analytics_consents_user_purpose_unique").on(table.userId, table.purpose),
]);

export const analyticsConsentHistory = pgTable("analytics_consent_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  purpose: text("purpose").notNull(),
  action: text("action").notNull(),
  policyVersion: text("policy_version").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  // No updatedAt/update method anywhere in packages/db's repository — append-only by design
  // (Domain Rule: consent history mirrors audit_log's "never editable" contract).
}, (table) => [
  index("analytics_consent_history_user_purpose_idx").on(table.userId, table.purpose),
]);

// Internal aggregates only — deliberately has NO user_id/accountId/transactionId column
// anywhere (Acceptance Criterion). cohortSizeBucket is itself a bucketed string (e.g. "100-249"),
// never the exact count, so exact cohort size can't be inferred by diffing runs over time.
export const analyticsCohortMetrics = pgTable("analytics_cohort_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  period: text("period").notNull(),
  regionBucket: text("region_bucket").notNull(),
  ageBucket: text("age_bucket").notNull(),
  incomeBucket: text("income_bucket").notNull(),
  employmentBucket: text("employment_bucket").notNull(),
  metricCode: text("metric_code").notNull(),
  cohortSizeBucket: text("cohort_size_bucket").notNull(),
  suppressed: boolean("suppressed").notNull(),
  medianValue: numeric("median_value", { precision: 20, scale: 6 }),
  p25Value: numeric("p25_value", { precision: 20, scale: 6 }),
  p75Value: numeric("p75_value", { precision: 20, scale: 6 }),
  privacyVersion: text("privacy_version").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("analytics_cohort_metrics_cohort_metric_unique").on(
    table.period, table.regionBucket, table.ageBucket, table.incomeBucket, table.employmentBucket, table.metricCode,
  ),
  index("analytics_cohort_metrics_period_idx").on(table.period),
]);

// user_onboarding / user_financial_profiles (TASK-063) — `status`/`current_step` are TEXT, not
// pgEnum, same rationale as every other evolving categorical column added this session (avoids
// pgEnum's ADD VALUE migration-ordering pitfalls; see TASK-055's Notes). `onboardingVersion` lets
// a future onboarding:v2 exist without forcing already-`COMPLETED` users to repeat v1's flow.
export const userOnboarding = pgTable("user_onboarding", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "restrict" }),
  version: text("version").notNull(),
  status: text("status").notNull(),
  currentStep: text("current_step").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
});

// Purely declarative — Domain Rule: "Declared Financial Context != Financial Truth." Never joined
// against or read by any Finance Engine calculation.
export const userFinancialProfiles = pgTable("user_financial_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "restrict" }),
  primaryGoal: text("primary_goal"),
  secondaryGoals: jsonb("secondary_goals").notNull().default([]),
  incomePattern: text("income_pattern"),
  usesCreditCards: text("uses_credit_cards"),
  hasDebtDeclared: text("has_debt_declared"),
  hasRecurringExpensesDeclared: text("has_recurring_expenses_declared"),
  usesMultipleAccounts: text("uses_multiple_accounts"),
  managementStyle: text("management_style"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// WP-SETTINGS-MISSING (spec 11 §4) — per-user presentation/behaviour preferences. These NEVER
// change financial semantics (§4.3): no toggle here can make a transfer count as income, include
// future income in available money, or sum currencies. One row per user, upserted.
export const preferenceThemeEnum = pgEnum("preference_theme", ["SYSTEM", "LIGHT", "DARK"]);
export const preferenceReportPeriodEnum = pgEnum("preference_report_period", ["THIS_MONTH", "LAST_MONTH", "LAST_30_DAYS"]);
export const preferenceCaptureModeEnum = pgEnum("preference_capture_mode", ["QUICK", "FULL"]);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: preferenceThemeEnum("theme").notNull().default("SYSTEM"),
  defaultReportPeriod: preferenceReportPeriodEnum("default_report_period").notNull().default("THIS_MONTH"),
  weekStartsOn: integer("week_starts_on").notNull().default(1),
  showCents: boolean("show_cents").notNull().default(true),
  compactLargeNumbers: boolean("compact_large_numbers").notNull().default(true),
  rememberLastAccount: boolean("remember_last_account").notNull().default(true),
  rememberLastCategory: boolean("remember_last_category").notNull().default(true),
  captureMode: preferenceCaptureModeEnum("capture_mode").notNull().default("QUICK"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("user_preferences_week_starts_on_check", sql`${table.weekStartsOn} in (0, 1)`),
]);

// Cached foreign-exchange quotes from an external source (currently only dolarapi's "dólar
// blue", USD/ARS). Never part of the ledger — money is always stored in its own currency.
// These rows only back the *explicit, labelled, estimated* conversions the reports and the
// dashboard offer on demand (spec 00 §285). One row per (source, pair, provider timestamp);
// the newest by `fetchedAt` is the one in effect.
export const fxRateSourceEnum = pgEnum("fx_rate_source", ["DOLAR_BLUE"]);

export const fxRates = pgTable("fx_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: fxRateSourceEnum("source").notNull(),
  base: varchar("base", { length: 3 }).notNull(),
  quote: varchar("quote", { length: 3 }).notNull(),
  /** compra — the market pays this for one unit of `base`. */
  bid: numeric("bid", { precision: 20, scale: 6 }).notNull(),
  /** venta — the market charges this for one unit of `base`. */
  ask: numeric("ask", { precision: 20, scale: 6 }).notNull(),
  /** The source's own "last updated" timestamp for this quote. */
  asOf: timestamp("as_of", { withTimezone: true }).notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
}, (table) => [
  uniqueIndex("fx_rates_source_pair_as_of_unique").on(table.source, table.base, table.quote, table.asOf),
  index("fx_rates_pair_fetched_idx").on(table.base, table.quote, table.fetchedAt),
  check("fx_rates_base_length_check", sql`char_length(${table.base}) = 3`),
  check("fx_rates_quote_length_check", sql`char_length(${table.quote}) = 3`),
  check("fx_rates_positive_check", sql`${table.bid} > 0 and ${table.ask} > 0`),
]);

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type BillingPlan = typeof billingPlans.$inferSelect;
export type BillingSubscription = typeof billingSubscriptions.$inferSelect;
export type BillingPeriod = typeof billingPeriods.$inferSelect;
export type BillingPayment = typeof billingPayments.$inferSelect;
export type BillingWebhookEvent = typeof billingWebhookEvents.$inferSelect;
export type BillingRefund = typeof billingRefunds.$inferSelect;
export type BillingDispute = typeof billingDisputes.$inferSelect;
export type PromotionCode = typeof promotionCodes.$inferSelect;
export type PromotionRedemption = typeof promotionRedemptions.$inferSelect;
export type PromotionalAccessGrant = typeof promotionalAccessGrants.$inferSelect;
export type PromotionAccessPeriod = typeof promotionAccessPeriods.$inferSelect;
export type AdminRoleRecord = typeof adminRoles.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type ReferralAttribution = typeof referralAttributions.$inferSelect;
export type ReferralReward = typeof referralRewards.$inferSelect;
export type AICreditEntry = typeof aiCreditEntries.$inferSelect;
export type AICreditReservation = typeof aiCreditReservations.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type AnalyticsEventLogEntry = typeof analyticsEventLog.$inferSelect;
export type UserStatisticalProfile = typeof userStatisticalProfiles.$inferSelect;
export type AnalyticsConsent = typeof analyticsConsents.$inferSelect;
export type AnalyticsConsentHistoryEntry = typeof analyticsConsentHistory.$inferSelect;
export type AnalyticsCohortMetric = typeof analyticsCohortMetrics.$inferSelect;
export type NotificationWhatsappConsent = typeof notificationWhatsappConsent.$inferSelect;
export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type UserFinancialProfile = typeof userFinancialProfiles.$inferSelect;
export type FxRate = typeof fxRates.$inferSelect;
