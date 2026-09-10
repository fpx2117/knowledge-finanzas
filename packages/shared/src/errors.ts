export const applicationErrorCodes = [
  "UNAUTHENTICATED",
  "INVALID_INPUT",
  "ACCOUNT_NOT_FOUND",
  "ACCOUNT_ARCHIVED",
  "CATEGORY_NOT_FOUND",
  "CATEGORY_ARCHIVED",
  "CATEGORY_TYPE_MISMATCH",
  "TRANSACTION_NOT_FOUND",
  "TRANSACTION_ALREADY_VOIDED",
  "RULE_NOT_FOUND",
  "RECURRING_SERIES_NOT_FOUND",
  "CURRENCY_MISMATCH",
  "INVALID_AMOUNT",
  "INSUFFICIENT_BALANCE",
  "INTERNAL_ERROR",
  "TRANSFER_ACCOUNT_NOT_FOUND",
  "TRANSFER_ACCOUNT_ARCHIVED",
  "TRANSFER_SAME_ACCOUNT",
  "TRANSFER_CURRENCY_MISMATCH",
  "TRANSFER_AMOUNT_INVALID",
  "TRANSFER_DATE_INVALID",
  "TRANSFER_BEFORE_ACCOUNT_OPENING",
  "TRANSFER_PERSISTENCE_FAILED",
  "TRANSFER_NOT_FOUND",
  "TRANSFER_ALREADY_VOIDED",
  "TRANSFER_INCOMPLETE",
  "BUDGET_NOT_FOUND",
  "BUDGET_CATEGORY_NOT_FOUND",
  "BUDGET_CATEGORY_TYPE_INVALID",
  "BUDGET_CATEGORY_ARCHIVED",
  "INVALID_BUDGET_AMOUNT",
  "BUDGET_ALREADY_EXISTS",
  "BUDGET_CURRENCY_MISMATCH",
  "BUDGET_ARCHIVED",
  "GOAL_NOT_FOUND",
  "GOAL_NOT_ACTIVE",
  "GOAL_WITHDRAWAL_EXCEEDS_PROGRESS",
  "PRODUCT_ACCESS_READ_ONLY",
  "TRIAL_EXPIRED",
  "TRIAL_NOT_ACTIVE",
  "PRO_SUBSCRIPTION_REQUIRED",
  "FEATURE_NOT_ENTITLED",
  "USAGE_LIMIT_REACHED",
  "AI_CREDITS_EXHAUSTED",
  "WHATSAPP_LIMIT_REACHED",
  "FORBIDDEN",
  "ADMIN_REASON_REQUIRED",
  "ADMIN_TARGET_USER_NOT_FOUND",
  "ADMIN_SEARCH_QUERY_TOO_BROAD",
] as const;

export type ApplicationErrorCode = (typeof applicationErrorCodes)[number];

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly field?: string;

  constructor(code: ApplicationErrorCode, options: { field?: string; cause?: unknown } = {}) {
    super(code);
    if (options.cause !== undefined) {
      Object.defineProperty(this, "cause", {
        configurable: true,
        value: options.cause,
      });
    }
    this.name = "ApplicationError";
    this.code = code;
    this.field = options.field;
  }
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}
