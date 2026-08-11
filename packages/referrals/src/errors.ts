export const referralErrorCodes = [
  "REFERRAL_CODE_NOT_FOUND",
  "REFERRAL_CODE_REVOKED",
  "REFERRAL_SELF_REFERRAL",
  "REFERRAL_ATTRIBUTION_WINDOW_EXPIRED",
  "REFERRAL_ALREADY_ATTRIBUTED",
  "REFERRAL_ATTRIBUTION_NOT_FOUND",
  "REFERRAL_REWARD_CAP_REACHED",
  "REFERRAL_REWARD_NOT_FOUND",
  "REFERRAL_REWARD_NOT_RETRYABLE",
  "REFERRAL_REASON_REQUIRED",
] as const;

export type ReferralErrorCode = (typeof referralErrorCodes)[number];

export class ReferralError extends Error {
  readonly code: ReferralErrorCode;
  readonly field?: string;

  constructor(code: ReferralErrorCode, options: { field?: string; cause?: unknown } = {}) {
    super(code);
    if (options.cause !== undefined) {
      Object.defineProperty(this, "cause", { configurable: true, value: options.cause });
    }
    this.name = "ReferralError";
    this.code = code;
    this.field = options.field;
  }
}

export function isReferralError(error: unknown): error is ReferralError {
  return error instanceof ReferralError;
}
