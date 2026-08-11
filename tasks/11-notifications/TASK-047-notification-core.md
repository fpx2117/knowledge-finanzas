# TASK-047 — Establish notification domain, persistence and preferences

## Status

DONE

## Phase

Phase 11 — Notifications + Alerts

## Priority

P1

## Depends On

- TASK-007
- TASK-017
- TASK-023
- TASK-030

## Source Documents

- docs/09-notifications-alerts.md
- docs/01-domain-model.md
- docs/02-database-schema.md
- docs/07-ui-system.md
- docs/19-security-privacy.md

## Objective

Crear el núcleo de notificaciones persistidas, preferencias por usuario y contratos de reglas/delivery sin convertir notificaciones en fuente de verdad financiera.

## Scope

- `NotificationType`, category (`FINANCIAL`, `BILLING`, `SECURITY`, `ACCOUNT`, `PRODUCT`), priority, channels and delivery states.
- `notifications`, `notification_deliveries` and `notification_preferences` schema with ownership, indexes and retention fields.
- `NotificationIntent` and `NotificationRuleEngine` contracts.
- Preference resolution, global channel OFF, per-type settings, timing and user timezone.
- Explicit WhatsApp opt-in/opt-out timestamps and normalized notification metadata.
- Channel entitlements and allowance metadata for `TRIAL`, `PRO` and `EXPIRED_READ_ONLY`.
- Stable internal entity links from `entityType` + `entityId`; never provider-supplied arbitrary URLs.
- Normalized notification errors and deduplication key contracts.

## Out of Scope

- Provider integrations, SSE, worker queues and delivery retries.
- Push mobile, SMS, advanced privacy levels and complex escalation rules.

## Domain Rules

- Notification is derived information and never equals a transaction, debt or obligation.
- Creating, reading, archiving or failing delivery cannot mutate financial state.
- Preferences and timing use the user's timezone, never server timezone.
- WhatsApp requires explicit opt-in and is disabled by default.
- Billing/security/account notifications remain eligible in expired state even when financial premium notifications are disabled.
- In-app and realtime are separate concepts; persistence does not depend on a connected browser.

## Expected Files

- `packages/notifications/src/domain/`
- `packages/notifications/src/application/`
- `packages/notifications/src/errors.ts`
- `packages/db/src/schema.ts`
- `packages/validation/` notification schemas

## Database Changes

- Add `notifications`, `notification_deliveries` and `notification_preferences` with ownership and deduplication constraints.
- Preserve delivery metadata independently from the logical notification.

## API / Application Services

- `CreateNotification`
- `ResolveNotificationPreferences`
- `MarkNotificationRead`
- `ArchiveNotification`
- `NotificationRuleEngine` contract

## UI Changes

Consumed by TASK-048 for notification center and settings.

## Security Requirements

- All queries and mutations validate ownership server-side.
- External channel payloads must use minimal, non-sensitive data.
- Provider credentials and webhook data remain server-only.

## Financial Invariants

- Notification operations never alter accounts, transactions, debts, budgets or balances.
- Financial writes must not depend on notification persistence or delivery success.

## Error Cases

- Duplicate intent, invalid entity link, preference disabled, invalid channel, invalid timing and foreign notification ID.

## Acceptance Criteria

- [x] Notification and delivery types are explicit enums/contracts, not UI free strings (`packages/notifications/src/domain/types.ts`, mirroring the DB enums already established when `notifications`/`notification_deliveries`/`notification_preferences`/`notification_whatsapp_consent` were migrated).
- [x] Notification state derives from `readAt` and `dismissedAt` (schema's actual field name; the task text said `archivedAt` — same concept).
- [x] Delivery rows are separate from the logical notification.
- [x] Deduplication keys prevent duplicate notification intents for the same event/window (enforced by a DB partial unique index, verified at the application layer too).
- [x] Global channel OFF overrides per-type preferences.
- [x] WhatsApp cannot be enabled without explicit opt-in.
- [x] Notification retention is configurable and does not delete financial history. — Structurally true (no notification table has an FK to any financial table); an actual retention *sweep* is deferred the same way `TASK-057`'s grace-period sweep was — no scheduler/worker exists yet (`TASK-041`/`TASK-049`).

## Tests Required

### Unit

- [x] Preference resolution, global overrides, quiet hours and timezone calculations (`tests/unit/notification-quiet-hours.test.ts`, `tests/unit/notification-channel-eligibility.test.ts`).
- [x] Notification state, entity links, dedup keys and error mapping (`tests/unit/notification-application-services.test.ts`).

### Integration

- [x] Schema constraints, ownership and notification/delivery persistence (`tests/integration/notifications.test.ts`).

### E2E

None; notification center is covered by TASK-048.

### Security

- [x] User A cannot read or modify User B notifications/preferences.

### Property / Invariant

- [x] Notification mutations never mutate canonical financial records.

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Notification domain and persistence contracts exist with ownership, preferences, deduplication and financial independence.

## Notes

Persistence (`notifications`, `notification_deliveries`, `notification_preferences`, `notification_whatsapp_consent` schema + migration + base `notifications`/`notification-deliveries` DB repositories) already existed before this task, but was completely unwired (not even exported from `@know-finanzas/db`) and untested. This task: exported the existing repositories, added the missing `notification-preferences` repository, fixed a real bug (`notification-deliveries.ts`'s `incrementAttempt` was a dead stub always resolving to `undefined`, silently never incrementing `attemptCount`), and built the actual application layer — a new `packages/notifications` package with `NotificationIntent`/`NotificationRuleEngine` contracts, channel-eligibility resolution (entitlement + preference + WhatsApp opt-in, with `BILLING`/`SECURITY`/`ACCOUNT` categories bypassing entitlement gating per the domain rule), quiet-hours timezone math, and the five application services (`CreateNotification`, `ResolveNotificationPreferences`, `MarkNotificationRead`, `ArchiveNotification`, plus `UpdateNotificationPreference`/`WhatsappConsent` needed to actually exercise preferences). Wired into `apps/web/src/lib/notifications/*.instance.ts`, ready for TASK-048 (notification center UI) and TASK-049 (concrete per-event rules + worker) to consume — neither of those exists yet, by design (out of scope here).

No UI was added (Expected per this task's own "UI Changes: Consumed by TASK-048"). Nothing in the app yet *calls* `createNotification` for a real event (e.g. "budget exceeded") — deciding *when* to fire which notification is `NotificationRuleEngine`'s concrete implementation, explicitly TASK-049's job; this task only had to establish the contract shape, which it does.
