export const billingErrorCodes = [
  "BILLING_DISABLED",
  "BILLING_PROVIDER_ERROR",
  "BILLING_PLAN_NOT_FOUND",
  "BILLING_PLAN_INACTIVE",
  "BILLING_SUBSCRIPTION_ALREADY_ACTIVE",
  "BILLING_SUBSCRIPTION_PENDING",
  "BILLING_SUBSCRIPTION_NOT_FOUND",
  "BILLING_SUBSCRIPTION_ALREADY_CANCELLED",
  "BILLING_REFRESH_RATE_LIMITED",
  "BILLING_PAYMENT_FAILED",
  "BILLING_WEBHOOK_INVALID",
  "BILLING_WEBHOOK_DUPLICATE",
  "BILLING_RECONCILIATION_FAILED",
  "BILLING_PAYMENT_NOT_FOUND",
  "BILLING_REFUND_NOT_AUTHORIZED",
  "BILLING_REFUND_REASON_REQUIRED",
  "BILLING_REFUND_PAYMENT_NOT_REFUNDABLE",
  "BILLING_REFUND_AMOUNT_EXCEEDS_PAYMENT",
  "BILLING_TRIAL_NOT_ELIGIBLE",
] as const;

export type BillingErrorCode = (typeof billingErrorCodes)[number];

export class BillingError extends Error {
  readonly code: BillingErrorCode;
  readonly field?: string;

  constructor(code: BillingErrorCode, options: { field?: string; cause?: unknown } = {}) {
    super(code);
    if (options.cause !== undefined) {
      Object.defineProperty(this, "cause", {
        configurable: true,
        value: options.cause,
      });
    }
    this.name = "BillingError";
    this.code = code;
    this.field = options.field;
  }
}

export function isBillingError(error: unknown): error is BillingError {
  return error instanceof BillingError;
}
