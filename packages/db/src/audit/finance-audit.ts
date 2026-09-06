import { and, eq, isNull, ne, sql } from "drizzle-orm";

import type { Database } from "../client";
import {
  accounts,
  categories,
  debtInstallments,
  debtPaymentAllocations,
  debtPayments,
  goalAllocations,
  goals,
  scheduledTransactions,
  transactions,
  transfers,
} from "../schema";

// TASK-043: a read-only validator for the Financial Invariants that Postgres's own schema
// constraints don't (and can't) express — cross-row/cross-table arithmetic and ownership
// consistency, not single-row shape. Never writes anything (Implementation Notes: "audit reports
// scanned/invalid records and never changes data by default"). Every check below queries for the
// *violation* directly (a LEFT JOIN/aggregate that only returns rows when something is wrong)
// rather than loading whole tables into memory and comparing in JS — this needs to stay usable
// against a real restored database, not just small test fixtures.

export type AuditSeverity = "ERROR" | "WARNING";

export type AuditFinding = {
  severity: AuditSeverity;
  check: string;
  entityType: string;
  entityId: string;
  message: string;
};

export type AuditReport = {
  findings: AuditFinding[];
  scannedCounts: Record<string, number>;
};

// Every transfer must have exactly one TRANSFER_OUT and one TRANSFER_IN leg, matching amount,
// currency, and status — the two partial unique indexes on transactions already guarantee "at
// most one of each type per transfer"; this checks the parts they can't: "at least one of each,"
// "same amount/currency," and "same status" (both legs post/void together, never independently).
export async function checkTransferLegPairing(database: Database): Promise<AuditFinding[]> {
  const rows = await database
    .select({
      transferId: transfers.id,
      transferAmount: transfers.amount,
      transferCurrency: transfers.currencyCode,
      legCount: sql<number>`count(${transactions.id})`,
      outCount: sql<number>`count(*) filter (where ${transactions.type} = 'TRANSFER_OUT')`,
      inCount: sql<number>`count(*) filter (where ${transactions.type} = 'TRANSFER_IN')`,
      distinctAmounts: sql<number>`count(distinct ${transactions.amount})`,
      distinctCurrencies: sql<number>`count(distinct ${transactions.currencyCode})`,
      distinctStatuses: sql<number>`count(distinct ${transactions.status})`,
    })
    .from(transfers)
    .leftJoin(transactions, eq(transactions.transferId, transfers.id))
    .groupBy(transfers.id, transfers.amount, transfers.currencyCode)
    .having(sql`
      count(*) filter (where ${transactions.type} = 'TRANSFER_OUT') <> 1
      or count(*) filter (where ${transactions.type} = 'TRANSFER_IN') <> 1
      or count(distinct ${transactions.amount}) > 1
      or count(distinct ${transactions.currencyCode}) > 1
      or count(distinct ${transactions.status}) > 1
    `);

  return rows.map((row) => ({
    severity: "ERROR",
    check: "transfer_leg_pairing",
    entityType: "transfer",
    entityId: row.transferId,
    message: `expected exactly one TRANSFER_OUT and one TRANSFER_IN leg with matching amount/currency/status; found out=${row.outCount} in=${row.inCount} distinctAmounts=${row.distinctAmounts} distinctCurrencies=${row.distinctCurrencies} distinctStatuses=${row.distinctStatuses}`,
  }));
}

// A POSTED debt payment's allocations must sum to exactly the payment's own amount — under- or
// over-allocating would silently misstate how much of the payment actually reduced the debt.
export async function checkDebtPaymentAllocationEquality(database: Database): Promise<AuditFinding[]> {
  const rows = await database
    .select({
      paymentId: debtPayments.id,
      paymentAmount: debtPayments.amount,
      allocatedTotal: sql<string>`coalesce(sum(${debtPaymentAllocations.amount}), 0)`,
    })
    .from(debtPayments)
    .leftJoin(debtPaymentAllocations, eq(debtPaymentAllocations.paymentId, debtPayments.id))
    .where(eq(debtPayments.status, "POSTED"))
    .groupBy(debtPayments.id, debtPayments.amount)
    .having(sql`coalesce(sum(${debtPaymentAllocations.amount}), 0) <> ${debtPayments.amount}`);

  return rows.map((row) => ({
    severity: "ERROR",
    check: "debt_payment_allocation_equality",
    entityType: "debt_payment",
    entityId: row.paymentId,
    message: `payment amount ${row.paymentAmount} does not equal the sum of its allocations ${row.allocatedTotal}`,
  }));
}

// An installment's allocated total (from POSTED payments only) must never exceed its own total
// amount — an installment can't be paid more than it's actually worth.
export async function checkInstallmentNotOverpaid(database: Database): Promise<AuditFinding[]> {
  const rows = await database
    .select({
      installmentId: debtInstallments.id,
      totalAmount: debtInstallments.totalAmount,
      allocatedTotal: sql<string>`coalesce(sum(${debtPaymentAllocations.amount}), 0)`,
    })
    .from(debtInstallments)
    .leftJoin(debtPaymentAllocations, eq(debtPaymentAllocations.installmentId, debtInstallments.id))
    .leftJoin(debtPayments, and(eq(debtPayments.id, debtPaymentAllocations.paymentId), eq(debtPayments.status, "POSTED")))
    .groupBy(debtInstallments.id, debtInstallments.totalAmount)
    .having(sql`coalesce(sum(${debtPaymentAllocations.amount}) filter (where ${debtPayments.id} is not null), 0) > ${debtInstallments.totalAmount}`);

  return rows.map((row) => ({
    severity: "ERROR",
    check: "installment_not_overpaid",
    entityType: "debt_installment",
    entityId: row.installmentId,
    message: `allocated total ${row.allocatedTotal} exceeds the installment's total amount ${row.totalAmount}`,
  }));
}

// A transaction's account must belong to the same user as the transaction itself, its category
// (if any) must belong to that same user too, and its currency must match the account's currency
// — every one of these is a possible corruption class after a botched restore, even though the FK
// constraints alone don't (and structurally can't) express "same owner" or "same currency."
export async function checkTransactionOwnershipAndCurrency(database: Database): Promise<AuditFinding[]> {
  const ownershipMismatches = await database
    .select({ transactionId: transactions.id })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(ne(accounts.userId, transactions.userId));

  const categoryMismatches = await database
    .select({ transactionId: transactions.id })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(ne(categories.userId, transactions.userId));

  const currencyMismatches = await database
    .select({ transactionId: transactions.id })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(ne(accounts.currencyCode, transactions.currencyCode));

  return [
    ...ownershipMismatches.map((row) => ({ severity: "ERROR" as const, check: "transaction_account_ownership", entityType: "transaction", entityId: row.transactionId, message: "transaction's account belongs to a different user" })),
    ...categoryMismatches.map((row) => ({ severity: "ERROR" as const, check: "transaction_category_ownership", entityType: "transaction", entityId: row.transactionId, message: "transaction's category belongs to a different user" })),
    ...currencyMismatches.map((row) => ({ severity: "ERROR" as const, check: "transaction_account_currency", entityType: "transaction", entityId: row.transactionId, message: "transaction's currency does not match its account's currency" })),
  ];
}

// A POSTED scheduled transaction must have a posted_transaction_id that resolves to a real
// transaction owned by the same user/account — the unique index on posted_transaction_id already
// guarantees "at most one scheduled item per transaction," this checks "a POSTED item actually has
// one, and it's a real, correctly-owned row."
export async function checkScheduledTransactionPostedLink(database: Database): Promise<AuditFinding[]> {
  const missingLink = await database
    .select({ scheduledTransactionId: scheduledTransactions.id })
    .from(scheduledTransactions)
    .where(and(eq(scheduledTransactions.status, "POSTED"), isNull(scheduledTransactions.postedTransactionId)));

  const brokenLink = await database
    .select({ scheduledTransactionId: scheduledTransactions.id })
    .from(scheduledTransactions)
    .innerJoin(transactions, eq(transactions.id, scheduledTransactions.postedTransactionId))
    .where(and(
      eq(scheduledTransactions.status, "POSTED"),
      sql`(${scheduledTransactions.userId} <> ${transactions.userId} or ${scheduledTransactions.accountId} <> ${transactions.accountId})`,
    ));

  return [
    ...missingLink.map((row) => ({ severity: "ERROR" as const, check: "scheduled_transaction_posted_link", entityType: "scheduled_transaction", entityId: row.scheduledTransactionId, message: "status is POSTED but posted_transaction_id is null" })),
    ...brokenLink.map((row) => ({ severity: "ERROR" as const, check: "scheduled_transaction_posted_link", entityType: "scheduled_transaction", entityId: row.scheduledTransactionId, message: "posted transaction's user/account does not match the scheduled item's own user/account" })),
  ];
}

// WP-GOALS-ALLOC (spec 07 §6.2): `goal_allocations` is the source of truth for a goal's
// progress. `goals.current_amount` is a cache the goal service re-syncs inside the same
// transaction as every allocation write — this check is the guarantee it never drifts:
// the cache must equal Σ(INITIAL + CONTRIBUTION) − Σ(WITHDRAWAL), every allocation's currency
// must match the goal's, and every allocation must belong to the goal's owner.
export async function checkGoalAllocationConsistency(database: Database): Promise<AuditFinding[]> {
  const driftRows = await database
    .select({
      goalId: goals.id,
      cached: goals.currentAmount,
      derived: sql<string>`coalesce(sum(case when ${goalAllocations.kind} = 'WITHDRAWAL' then -${goalAllocations.amount} else ${goalAllocations.amount} end), 0)`,
    })
    .from(goals)
    .leftJoin(goalAllocations, eq(goalAllocations.goalId, goals.id))
    .groupBy(goals.id, goals.currentAmount)
    .having(sql`${goals.currentAmount} <> coalesce(sum(case when ${goalAllocations.kind} = 'WITHDRAWAL' then -${goalAllocations.amount} else ${goalAllocations.amount} end), 0)`);

  const mismatchRows = await database
    .select({ allocationId: goalAllocations.id })
    .from(goalAllocations)
    .innerJoin(goals, eq(goals.id, goalAllocations.goalId))
    .where(sql`${goalAllocations.userId} <> ${goals.userId} or ${goalAllocations.currencyCode} <> ${goals.currencyCode}`);

  return [
    ...driftRows.map((row) => ({
      severity: "ERROR" as const,
      check: "goal_allocation_cache_consistency",
      entityType: "goal",
      entityId: row.goalId,
      message: `cached current_amount ${row.cached} does not equal the sum of its allocations ${row.derived}`,
    })),
    ...mismatchRows.map((row) => ({
      severity: "ERROR" as const,
      check: "goal_allocation_ownership_currency",
      entityType: "goal_allocation",
      entityId: row.allocationId,
      message: "allocation's user or currency does not match its goal",
    })),
  ];
}

export async function runFinanceAudit(database: Database): Promise<AuditReport> {
  const [transferFindings, allocationFindings, overpaidFindings, ownershipFindings, scheduledFindings, goalFindings] = await Promise.all([
    checkTransferLegPairing(database),
    checkDebtPaymentAllocationEquality(database),
    checkInstallmentNotOverpaid(database),
    checkTransactionOwnershipAndCurrency(database),
    checkScheduledTransactionPostedLink(database),
    checkGoalAllocationConsistency(database),
  ]);

  const [transferCount] = await database.select({ count: sql<number>`count(*)` }).from(transfers);
  const [transactionCount] = await database.select({ count: sql<number>`count(*)` }).from(transactions);
  const [debtPaymentCount] = await database.select({ count: sql<number>`count(*)` }).from(debtPayments);
  const [installmentCount] = await database.select({ count: sql<number>`count(*)` }).from(debtInstallments);
  const [scheduledCount] = await database.select({ count: sql<number>`count(*)` }).from(scheduledTransactions);
  const [goalAllocationCount] = await database.select({ count: sql<number>`count(*)` }).from(goalAllocations);

  return {
    findings: [...transferFindings, ...allocationFindings, ...overpaidFindings, ...ownershipFindings, ...scheduledFindings, ...goalFindings],
    scannedCounts: {
      transfers: Number(transferCount?.count ?? 0),
      transactions: Number(transactionCount?.count ?? 0),
      debtPayments: Number(debtPaymentCount?.count ?? 0),
      debtInstallments: Number(installmentCount?.count ?? 0),
      scheduledTransactions: Number(scheduledCount?.count ?? 0),
      goalAllocations: Number(goalAllocationCount?.count ?? 0),
    },
  };
}
