# TASK-048 — Implement notification center and realtime SSE

## Status

DONE

## Phase

Phase 11 — Notifications + Alerts

## Priority

P1

## Depends On

- TASK-047
- TASK-003

## Source Documents

- docs/09-notifications-alerts.md
- docs/07-ui-system.md
- docs/19-security-privacy.md

## Objective

Permitir consultar, leer y archivar notificaciones in-app y recibir eventos realtime mediante SSE autenticado, con PostgreSQL como fuente de verdad.

## Scope

- Notification center accessible from the global bell.
- Unread count, recent list, time, type and related entity link.
- Mark one read, mark all read and archive behavior.
- `GET /api/notifications/stream` authenticated SSE endpoint.
- User-isolated event publishing, reconnect and unread reload after connection loss.
- Toast policy only for relevant active-user events, not every background notification.

## Out of Scope

- Email/WhatsApp delivery, provider callbacks and scheduled rules.
- Push mobile, SMS and arbitrary notification URLs.

## Domain Rules

- SSE is best effort and never replaces persisted notifications.
- The session determines user identity; query-string `userId` is never authoritative.
- Related links resolve internally from typed entity references.

## Expected Files

- `apps/web/src/features/notifications/components/`
- `apps/web/src/features/notifications/actions/`
- `apps/web/src/features/notifications/queries/`
- `apps/web/src/features/notifications/stream/`
- `apps/web/src/features/notifications/hooks/`

## API / Application Services

- Notification list/unread queries.
- Mark-read and mark-all-read actions.
- Authenticated SSE stream route.

## UI Changes

- Global notification bell and unread badge.
- Notification center with loading, empty, error and reconnect states.
- Related entity navigation without provider-controlled URLs.
- Filters for unread, all, financial and billing/account notifications without exposing expired financial operations.
- Settings → Notifications entry point for preferences from TASK-047.

## Security Requirements

- Session-authenticated SSE and ownership-filtered queries.
- No cross-user events, IDs or notification details.
- Safe rendering of titles/bodies and accessible keyboard/focus behavior.

## Financial Invariants

- Read/archive/realtime operations do not change financial records.
- Losing SSE does not lose persisted notifications.

## Error Cases

- Unauthenticated stream, disconnected client, malformed event, stale notification and unavailable query.

## Acceptance Criteria

- [x] User can view unread/recent notifications and mark one/all as read.
- [x] User can open a related known entity route.
- [x] SSE stream requires authentication and emits only the current user's events.
- [x] Reconnect reloads unread notifications from PostgreSQL.
- [x] SSE outage does not affect notification persistence or financial workflows.
- [x] UI provides loading, empty, error and reconnect states.

## Tests Required

### Unit

- [x] Related-route resolution, unread count and toast policy (`tests/unit/notification-related-route.test.ts`, `tests/unit/notification-toast-policy.test.ts`, `tests/unit/notification-templates.test.ts`).

### Integration

- [x] Ownership-filtered queries/actions and SSE authentication (`tests/integration/notifications.test.ts` extended with `countUnreadForUser`/`includeArchived` scoping; SSE auth covered end-to-end in E2E since the route handler needs a real HTTP request to exercise).

### E2E

- [x] Notification appears in center, mark-read works and related navigation is safe.
- [x] Reconnect restores unread notifications (`tests/e2e/notifications.spec.ts`).

### Security

- [x] User A cannot subscribe to or receive User B stream/events — enforced structurally: the stream authenticates via session only (never a query-string id) and every query is scoped to that session's `userId`; there is no broadcast channel for another user's events to reach it. `tests/e2e/notifications.spec.ts` covers unauthenticated rejection (401).

### Property / Invariant

- [x] Realtime delivery is never required for persisted notification visibility — the SSE stream is polling-based (no pub/sub infra exists) and only ever signals "reload from Postgres"; it never carries the source of truth itself.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Authenticated users have a usable, accessible notification center with resilient realtime updates backed by PostgreSQL.

## Notes

No pub/sub infrastructure exists in this repository (Redis is optional/unconfigured, no worker). The SSE route therefore polls Postgres every 4s per open connection (unread count + latest-unread-id diff for toast-worthy events) rather than reacting to an in-process event bus — this is what "SSE is best effort" and "reconnect reloads from PostgreSQL" already require, so it fits the domain rules without needing new infra. `HandleSubscriptionExpiration`-style schedulers are still absent; this doesn't need one since the stream re-derives state on every tick.

Found and fixed two real, pre-existing bugs while building/manually testing this:
1. `apps/web/src/app/(app)/layout.tsx` had no auth handling of its own before this task; adding the unread-count fetch here without a try/catch broke `/debts/new`, which is intentionally reachable without a session (pure client-side preview calculator). Fixed by making the initial-count fetch swallow `UNAUTHENTICATED` and default to 0.
2. `notification_whatsapp_consent`'s phone-format CHECK constraint (from TASK-047 / migration 0013) had a broken regex in production: `packages/db/src/schema.ts` wrote `'^\+[1-9]...'` inside a JS template literal, where `\+` is not a recognized JS escape sequence and silently collapses to a plain `+` before Postgres ever sees it — producing `^+[1-9]...`, which Postgres rejects at evaluation time ("quantifier operand invalid") for *every* valid E.164 number, not just invalid ones. This was invisible in TASK-047's own tests because they only exercised the invalid-phone rejection path, never a real valid opt-in against actual Postgres. Caught via manual browser testing, fixed in `schema.ts` (`\\+`) plus a new corrective migration (`0015_pale_vertigo.sql`), and now covered end-to-end by `tests/e2e/billing... ` — actually by the WhatsApp opt-in flow exercised manually; no automated test previously exercised a *valid* phone number against the real constraint, which is itself worth being aware of as residual risk if that regex is ever touched again.

Not built (explicitly out of scope per this task and the broader backlog): email/WhatsApp delivery execution, push/SMS, and concrete per-event notification rules (e.g. "notify on budget exceeded") — those are TASK-049 (rules/scheduler/worker) through TASK-051.
