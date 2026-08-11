export const privacyErrorCodes = [
  "PRIVACY_INVALID_STATISTICAL_PROFILE_FIELD",
  "PRIVACY_INVALID_CONSENT_PURPOSE",
] as const;

export type PrivacyErrorCode = (typeof privacyErrorCodes)[number];

export class PrivacyError extends Error {
  readonly code: PrivacyErrorCode;
  readonly field?: string;

  constructor(code: PrivacyErrorCode, options: { field?: string; cause?: unknown } = {}) {
    super(code);
    if (options.cause !== undefined) {
      Object.defineProperty(this, "cause", { configurable: true, value: options.cause });
    }
    this.name = "PrivacyError";
    this.code = code;
    this.field = options.field;
  }
}

export function isPrivacyError(error: unknown): error is PrivacyError {
  return error instanceof PrivacyError;
}
