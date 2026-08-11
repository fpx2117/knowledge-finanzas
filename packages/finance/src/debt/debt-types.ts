export type DebtType = "PERSONAL_LOAN" | "PURCHASE_INSTALLMENTS" | "MONEY_OWED_TO_PERSON" | "SERVICE_DEBT" | "OTHER";
export type DebtStatus = "ACTIVE" | "PAID" | "OVERDUE" | "CANCELLED";
export type InterestType = "NO_INTEREST" | "FIXED_INSTALLMENTS" | "MANUAL_INSTALLMENTS";
export type InstallmentStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
export type DebtPaymentStatus = "POSTED" | "REVERSED";

export type DebtRecord = {
  id: string;
  userId: string;
  name: string;
  creditor: string | null;
  type: DebtType;
  currencyCode: string;
  originalAmount: string;
  startDate: string;
  status: DebtStatus;
  interestType: InterestType;
  interestRate: string | null;
};

export type DebtInstallmentRecord = {
  id: string;
  debtId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  feeAmount: string;
  totalAmount: string;
  status: InstallmentStatus;
};
