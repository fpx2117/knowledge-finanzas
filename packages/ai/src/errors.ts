// Normalized AI error taxonomy (docs/08-ai-openrouter.md §90). AIProvider and the execution
// orchestrator only ever throw these codes — never a raw provider/HTTP error — so callers can
// degrade gracefully without knowing about OpenRouter specifically.
export const aiErrorCodes = [
  "AI_DISABLED",
  "AI_ACCESS_REQUIRED",
  "AI_ENTITLEMENT_REQUIRED",
  "AI_CREDITS_EXHAUSTED",
  "AI_CREDIT_RESERVATION_FAILED",
  "AI_CREDIT_OPERATION_DUPLICATE",
  "AI_USAGE_LIMIT_REACHED",
  "AI_USAGE_RATE_LIMITED",
  "AI_TIMEOUT",
  "AI_RATE_LIMITED",
  "AI_INVALID_OUTPUT",
  "AI_MODEL_UNAVAILABLE",
  "AI_MODEL_UNSUPPORTED",
  "AI_PROVIDER_ERROR",
] as const;

export type AIErrorCode = (typeof aiErrorCodes)[number];

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly field?: string;

  constructor(code: AIErrorCode, options: { field?: string; cause?: unknown } = {}) {
    super(code);
    if (options.cause !== undefined) {
      Object.defineProperty(this, "cause", {
        configurable: true,
        value: options.cause,
      });
    }
    this.name = "AIError";
    this.code = code;
    this.field = options.field;
  }
}

export function isAIError(error: unknown): error is AIError {
  return error instanceof AIError;
}
