export const promotionErrorCodes = [
  "PROMOTION_INVALID",
  "PROMOTION_NOT_ACTIVE",
  "PROMOTION_NOT_STARTED",
  "PROMOTION_EXPIRED",
  "PROMOTION_REDEMPTION_LIMIT_REACHED",
  "PROMOTION_USER_LIMIT_REACHED",
  "PROMOTION_ALREADY_REDEEMED",
  "PROMOTION_ALREADY_ACTIVE",
  "PROMOTION_NOT_STACKABLE",
  "PROMOTION_NOT_APPLICABLE_TO_ACTIVE_SUBSCRIPTION",
  "PROMOTION_REDEMPTION_RATE_LIMITED",
  "PROMOTION_NOT_FOUND",
  "PROMOTION_CODE_ALREADY_EXISTS",
  "PROMOTION_GRANT_NOT_FOUND",
] as const;

export type PromotionErrorCode = (typeof promotionErrorCodes)[number];

export class PromotionError extends Error {
  readonly code: PromotionErrorCode;
  readonly field?: string;

  constructor(code: PromotionErrorCode, options: { field?: string; cause?: unknown } = {}) {
    super(code);
    if (options.cause !== undefined) {
      Object.defineProperty(this, "cause", { configurable: true, value: options.cause });
    }
    this.name = "PromotionError";
    this.code = code;
    this.field = options.field;
  }
}

export function isPromotionError(error: unknown): error is PromotionError {
  return error instanceof PromotionError;
}
