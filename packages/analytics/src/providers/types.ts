import type { AnalyticsEvent } from "../domain/types";

// The one seam every AnalyticsProvider implementation (Postgres today via packages/db, a real
// vendor SDK adapter later) must satisfy — AnalyticsService.track() only ever calls this, never a
// vendor SDK directly (task's Scope).
export type AnalyticsProvider = {
  // `created: false` signals a duplicate that was safely absorbed (e.g. a Postgres unique
  // constraint on eventId) — not an error.
  record(event: AnalyticsEvent): Promise<{ created: boolean }>;
};
