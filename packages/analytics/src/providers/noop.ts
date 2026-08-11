import type { AnalyticsProvider } from "./types";

// Safe default for any consumer (tests, a not-yet-wired feature) that doesn't pass a real
// provider — never throws, never persists anything.
export const noopAnalyticsProvider: AnalyticsProvider = {
  record: async () => ({ created: true }),
};
