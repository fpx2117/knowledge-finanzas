import { Money } from "@know-finanzas/finance";

// Reuses the Finance Engine's own Money/Decimal arithmetic exclusively — never reimplements
// transaction-type semantics (Implementation Notes: "nunca reimplementando semántica de
// transacciones ad-hoc"). The caller is responsible for producing these already-classified
// totals via packages/finance's classifyLedgerEffect (income/consumptionDelta), which is what
// correctly excludes transfers/adjustments/voided rows from "spending" (Financial Invariant: "no
// transfers counted as spending, no double counting").
export type PeriodFinancialTotals = {
  currency: string;
  // Sum of classifyLedgerEffect(...).balanceDelta for ORDINARY_INCOME rows in the period.
  totalIncome: string;
  // Sum of classifyLedgerEffect(...).consumptionDelta for the period (already refund-adjusted).
  totalConsumption: string;
  // Sum of debt_payments.amount (status POSTED) for the period — a real, already-canonical
  // concept (packages/db's debt_payments table), not an invented category classification.
  totalDebtPayments: string;
};

// housing_cost_ratio and expense_category_ratios are deliberately NOT implemented here: this
// app's categories are free-text and user-defined with no canonical taxonomy (no "this category
// means housing" concept exists anywhere in the schema), so computing them would require
// inventing a classification — exactly the ad-hoc reimplementation the task's Implementation
// Notes forbid. See TASK-062's Notes for the full rationale.
export type DerivedFinancialMetrics = {
  savingsRate: number | null;
  debtServiceRatio: number | null;
};

export function deriveFinancialMetrics(totals: PeriodFinancialTotals): DerivedFinancialMetrics {
  const income = Money.fromString(totals.totalIncome, totals.currency);
  if (income.isZero() || income.amount.isNegative()) {
    return { savingsRate: null, debtServiceRatio: null };
  }

  const consumption = Money.fromString(totals.totalConsumption, totals.currency);
  const debtPayments = Money.fromString(totals.totalDebtPayments, totals.currency);

  const savings = income.subtract(consumption);
  const savingsRate = savings.amount.dividedBy(income.amount).toNumber();
  const debtServiceRatio = debtPayments.amount.dividedBy(income.amount).toNumber();

  return { savingsRate, debtServiceRatio };
}
