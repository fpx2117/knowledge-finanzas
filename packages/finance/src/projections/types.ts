export type UpcomingSourceType = "DEBT_INSTALLMENT" | "SCHEDULED_TRANSACTION";
export type UpcomingDirection = "INFLOW" | "OUTFLOW";
export type UpcomingStatus = "OVERDUE" | "DUE_TODAY" | "UPCOMING";
export type UpcomingConfidence = "COMMITTED" | "EXPECTED";
export type UpcomingItem = { sourceType: UpcomingSourceType; sourceId: string; direction: UpcomingDirection; title: string; date: string; amount: string; remainingAmount: string | null; currencyCode: string; status: UpcomingStatus; confidence: UpcomingConfidence; accountId: string | null; categoryId: string | null; debtId: string | null; installmentNumber: number | null; recurringTransactionId: string | null };
