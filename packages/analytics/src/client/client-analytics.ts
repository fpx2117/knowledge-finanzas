import type { AnalyticsEventName } from "../domain/types";

// Client-side UI interaction events (page views beyond dashboard/cashflow, CTA clicks, filter
// changes) are NOT wired to any onClick/useEffect handler in this pass — there is no analytics
// script loaded in the browser yet (Scope decision, see TASK-061's task notes). This type exists
// so a future client adapter (whatever vendor script eventually gets loaded) has a stable shape
// to implement, and so `checkout_started`/`notification_action_clicked`-style events can be
// typed consistently with the server-side registry even before they're fired from the client.
export type ClientAnalyticsEvent = {
  eventName: AnalyticsEventName;
  properties: unknown;
};

export type ClientAnalyticsAdapter = {
  track(event: ClientAnalyticsEvent): void;
};

// No-op until a real client adapter is wired — never throws, never sends anything.
export const noopClientAnalyticsAdapter: ClientAnalyticsAdapter = {
  track: () => {},
};
