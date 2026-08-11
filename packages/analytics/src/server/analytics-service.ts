import { getEventDefinition } from "../registry";
import type { AnalyticsEnvironment, AnalyticsEventName, TrackResult } from "../domain/types";
import type { AnalyticsProvider } from "../providers/types";
import { noopAnalyticsProvider } from "../providers/noop";

export type TrackOptions = {
  eventId?: string | null;
  userId?: string | null;
  internal?: boolean;
  occurredAt?: Date;
};

// The one function the rest of the codebase calls (Scope: "the rest of the code calls
// AnalyticsService.track(), never the vendor SDK directly"). Never throws — every failure mode
// (unknown event, invalid payload, missing event_id on a critical event, provider outage) is
// reported through the return value, so a calling financial/domain operation can never be broken
// by an analytics problem (Financial Invariant).
export function createAnalyticsService(dependencies: {
  provider?: AnalyticsProvider;
  environment: AnalyticsEnvironment;
  now?: () => Date;
}) {
  const provider = dependencies.provider ?? noopAnalyticsProvider;
  const now = dependencies.now ?? (() => new Date());

  return async function track(name: AnalyticsEventName, properties: unknown, options: TrackOptions = {}): Promise<TrackResult> {
    const definition = getEventDefinition(name);
    if (!definition) return { recorded: false, deduplicated: false, reason: "EVENT_NOT_REGISTERED" };

    if (definition.critical && !options.eventId) {
      return { recorded: false, deduplicated: false, reason: "EVENT_ID_REQUIRED" };
    }

    const parsed = definition.schema.safeParse(properties ?? {});
    if (!parsed.success) return { recorded: false, deduplicated: false, reason: "SCHEMA_INVALID" };

    try {
      const result = await provider.record({
        eventName: definition.name,
        eventVersion: definition.version,
        eventId: options.eventId ?? null,
        userId: options.userId ?? null,
        occurredAt: options.occurredAt ?? now(),
        environment: dependencies.environment,
        internal: options.internal ?? false,
        properties: parsed.data,
      });
      return result.created ? { recorded: true, deduplicated: false } : { recorded: false, deduplicated: true };
    } catch {
      return { recorded: false, deduplicated: false, reason: "PROVIDER_ERROR" };
    }
  };
}

export type AnalyticsService = ReturnType<typeof createAnalyticsService>;
