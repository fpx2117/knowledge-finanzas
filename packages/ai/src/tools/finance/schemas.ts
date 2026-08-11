import { z } from "zod";

// Every schema here is intentionally a minimized, already-aggregated DTO shape — never raw rows,
// balances-by-account internals, or anything beyond what an explanation needs (docs task-038
// Implementation Notes: "minimum aggregated data").

export const noArgsSchema = z.object({}).strict();

export const liquidBalancesResultSchema = z.array(z.object({ currencyCode: z.string(), total: z.string() }));

export const monthlySummaryResultSchema = z.array(z.object({ currencyCode: z.string(), income: z.string(), expense: z.string() }));

export const debtSummaryResultSchema = z.array(z.object({ currencyCode: z.string(), remaining: z.string() }));

export const upcomingObligationsResultSchema = z.array(z.object({
  title: z.string(),
  dueDate: z.string(),
  amount: z.string(),
  currencyCode: z.string(),
  sourceType: z.enum(["DEBT_INSTALLMENT", "SCHEDULED_TRANSACTION"]),
}));

export const budgetOverviewResultSchema = z.array(z.object({
  categoryName: z.string(),
  currencyCode: z.string(),
  limitAmount: z.string(),
  spentAmount: z.string(),
  usagePercent: z.number(),
  status: z.enum(["NORMAL", "NEAR_LIMIT", "EXCEEDED"]),
}));

export const cashflowProjectionResultSchema = z.array(z.object({
  currencyCode: z.string(),
  spendable: z.string(),
  projectedEndBalance: z.string(),
  minimumProjectedBalance: z.string(),
  shortfallAmount: z.string().nullable(),
}));

export const searchTransactionsArgsSchema = z.object({
  limit: z.number().int().min(1).max(20).default(10),
  daysBack: z.number().int().min(1).max(90).default(30),
});

export const searchTransactionsResultSchema = z.array(z.object({
  description: z.string(),
  merchant: z.string().nullable(),
  categoryName: z.string().nullable(),
  type: z.string(),
  amount: z.string(),
  currencyCode: z.string(),
  occurredAt: z.string(),
}));
