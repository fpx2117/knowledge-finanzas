export const analyticsErrorCodes = [
  "ANALYTICS_EVENT_NOT_REGISTERED",
  "ANALYTICS_EVENT_SCHEMA_INVALID",
  "ANALYTICS_EVENT_ID_REQUIRED",
] as const;

export type AnalyticsErrorCode = (typeof analyticsErrorCodes)[number];

// Only ever used internally (see application/analytics-service.ts) — AnalyticsService.track()
// itself never throws one of these to its caller (Financial Invariant: "analytics failures never
// propagate as errors to the calling financial operation"); this class exists so the internal
// failure path is typed and testable rather than a bag of magic strings.
export class AnalyticsError extends Error {
  readonly code: AnalyticsErrorCode;

  constructor(code: AnalyticsErrorCode) {
    super(code);
    this.name = "AnalyticsError";
    this.code = code;
  }
}

export function isAnalyticsError(error: unknown): error is AnalyticsError {
  return error instanceof AnalyticsError;
}
