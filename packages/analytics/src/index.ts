export {
  ANALYTICS_EVENT_NAMES,
  type AnalyticsEnvironment,
  type AnalyticsEvent,
  type AnalyticsEventName,
  type TrackResult,
} from "./domain/types";

export { type AmountBucket, bucketAmount } from "./domain/amount-bucket";
export { isInternalAccountEmail } from "./domain/internal-account";

export {
  ACTIVATION_V1_WINDOW_DAYS,
  ACTIVATION_V1_MIN_ACCOUNTS,
  ACTIVATION_V1_MIN_TRANSACTIONS,
  evaluateActivationV1,
  type ActivationV1Input,
} from "./domain/activation";

export { AnalyticsError, isAnalyticsError, analyticsErrorCodes, type AnalyticsErrorCode } from "./errors";

export { EVENT_REGISTRY, getEventDefinition } from "./registry";
export type { AnalyticsEventDefinition } from "./events/types";

export { type AnalyticsProvider } from "./providers/types";
export { noopAnalyticsProvider } from "./providers/noop";

export { createAnalyticsService, type AnalyticsService, type TrackOptions } from "./server/analytics-service";

export { type ClientAnalyticsAdapter, type ClientAnalyticsEvent, noopClientAnalyticsAdapter } from "./client/client-analytics";
