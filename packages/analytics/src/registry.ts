import { ANALYTICS_EVENT_NAMES, type AnalyticsEventName } from "./domain/types";
import type { AnalyticsEventDefinition } from "./events/types";
import { authEvents } from "./events/auth";
import { financeEvents } from "./events/finance";
import { billingEvents } from "./events/billing";
import { aiEvents } from "./events/ai";
import { notificationsEvents } from "./events/notifications";
import { referralsEvents } from "./events/referrals";
import { onboardingEvents } from "./events/onboarding";
import { accessSelectionEvents } from "./events/access-selection";

const ALL_DEFINITIONS: AnalyticsEventDefinition[] = [
  ...authEvents,
  ...financeEvents,
  ...billingEvents,
  ...aiEvents,
  ...notificationsEvents,
  ...referralsEvents,
  ...onboardingEvents,
  ...accessSelectionEvents,
];

const REGISTRY_MAP = new Map(ALL_DEFINITIONS.map((definition) => [definition.name, definition]));

// Runtime exhaustiveness guarantee (a TS `Record<AnalyticsEventName, ...>` cast can't actually
// enforce this over an array built from spreads) — fails fast at module load, not silently at
// some future track() call, if an events/*.ts file is ever missing an entry.
for (const name of ANALYTICS_EVENT_NAMES) {
  if (!REGISTRY_MAP.has(name)) throw new Error(`@know-finanzas/analytics: no event definition registered for "${name}"`);
}

export const EVENT_REGISTRY: ReadonlyMap<AnalyticsEventName, AnalyticsEventDefinition> = REGISTRY_MAP;

export function getEventDefinition(name: AnalyticsEventName): AnalyticsEventDefinition | undefined {
  return EVENT_REGISTRY.get(name);
}
