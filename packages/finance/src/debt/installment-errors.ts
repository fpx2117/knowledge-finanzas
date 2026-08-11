export type InstallmentEngineErrorCode = "INVALID_INSTALLMENT_COUNT" | "INVALID_FIRST_DUE_DATE" | "INVALID_ANCHOR_DAY" | "EMPTY_INSTALLMENTS" | "INVALID_INSTALLMENT_NUMBER" | "NON_SEQUENTIAL_INSTALLMENT_NUMBERS" | "DUPLICATE_DUE_DATE" | "DATES_NOT_STRICTLY_ASCENDING" | "INVALID_INSTALLMENT_AMOUNT" | "CURRENCY_MISMATCH" | "TOTAL_TOO_SMALL_FOR_INSTALLMENT_COUNT" | "INSTALLMENT_TOTAL_MISMATCH" | "INVALID_FREQUENCY";

export class InstallmentEngineError extends Error {
  readonly code: InstallmentEngineErrorCode;
  readonly field?: string;
  readonly installmentNumber?: number;
  constructor(code: InstallmentEngineErrorCode, options: { field?: string; installmentNumber?: number } = {}) {
    super(code);
    this.name = "InstallmentEngineError";
    this.code = code;
    this.field = options.field;
    this.installmentNumber = options.installmentNumber;
  }
}
