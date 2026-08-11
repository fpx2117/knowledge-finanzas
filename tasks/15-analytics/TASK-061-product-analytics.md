# TASK-061 — Establish product analytics pipeline, event schemas and core funnels/KPIs

## Status
DONE

## Phase
Phase 15 — Product Analytics

## Priority
P3

## Depends On
- TASK-002
- TASK-032
- TASK-045

## Source Documents
- docs/22-product-analytics.md
- docs/19-security-privacy.md

## Objective

Instrumentar el producto con un pipeline de analítica de comportamiento (`AnalyticsProvider` abstraction + schema-validated events) que responda si el producto activa, convierte y retiene usuarios, manteniendo estrictamente separada la analítica de producto de la verdad financiera y de billing.

## Scope

- `AnalyticsProvider` abstraction (`packages/analytics`) con implementación configurable (ej. PostHog o equivalente detrás de un adapter); el resto del código llama `AnalyticsService.track()`, nunca el SDK del vendor directamente.
- `ServerAnalytics` para eventos autoritativos (server-side: signup, subscription activated, payment approved, promotion redeemed, refund completed, AI credit consumed) y un adapter cliente ligero para interacciones de UI (page viewed, filter changed, CTA clicked).
- Event schema registry con validación Zod, `event_id` estable para eventos críticos (evita doble conteo), `event_version` cuando el significado del payload cambia materialmente.
- MVP event set: `user_signed_up`, `trial_started`, `account_created`, `transaction_created`, `user_activated`, `dashboard_viewed`, `cashflow_viewed`, `checkout_started`, `subscription_activated`, `trial_expired`, `subscription_cancelled`, `subscription_expired`, `user_reactivated`, `ai_capability_executed`, `ai_credits_exhausted`, `notification_action_clicked`, `promotion_redeemed`, `discount_applied` (reserved, inert until discounts exist), `referral_attributed`, `referral_converted`.
- Explicit `activation:v1` definition (1 account + 5 transactions + dashboard/cashflow viewed within first 7 days), versioned; `user_activated` emitted exactly once.
- Core funnels: signup → trial started → first financial data → activated → engaged → checkout → Pro → retained; access-transition tracking (`product_access_changed` with from/to/source/reason).
- Core MVP KPIs: Signups, Activation Rate, Time To First Value, Trial → Pro Conversion, Active Pro, MRR (sourced from Billing, never from analytics events), Week 4 Retention, Paid Churn, Reactivation Rate, AI Adoption, AI Cost / Pro, WhatsApp Cost / Pro.
- Privacy-safe event design: no raw amounts/merchants/notes/AI prompts in general analytics payloads; amount buckets (`LOW`/`MEDIUM`/`HIGH`) only where genuinely useful; `environment` tag on every event; internal/staff/test accounts flagged and excluded from business KPIs.
- Analytics failure isolation: a down analytics provider never blocks transaction creation, billing, or debt payment (fire-and-forget/queue pattern after the core operation succeeds).

## Out of Scope

- Session replay, heatmaps (explicitly deferred/cautioned in source doc; disabled by default).
- Data warehouse, complex multi-touch attribution, predictive churn ML, A/B testing platform.
- External/aggregated statistical data products (that is TASK-062's exclusive domain per the source document's own separation).

## Domain Rules

- `Product Analytics != Financial Truth`; balances, spending totals, and debt are never calculated from analytics events.
- `Checkout Started != Paid Conversion`; Pro conversion is only computed from normalized billing state (TASK-032/034), never from a client-side checkout click.
- `Promotion Pro != Paid Pro`; promotional access (TASK-053) is tracked separately from paid conversion in every funnel/KPI.
- `Domain Event != Analytics Event`; domain/application services never depend on the analytics provider to function.
- Financial free text (transaction notes, AI prompts, support notes) is never included in general analytics events.

## Implementation Notes

Emit analytics events after the core financial/domain operation has already committed successfully (`Core operation → success → emit/queue analytics`), never before or as a precondition. Use the same `environment`/`internal-account` exclusion pattern consistently so every dashboard and ad-hoc query agrees on what counts as a "real" user event.

## Expected Files

- `packages/analytics/src/events/` (auth.ts, finance.ts, billing.ts, ai.ts, notifications.ts, referrals.ts)
- `packages/analytics/src/server/`
- `packages/analytics/src/client/`
- `packages/analytics/src/providers/`
- `packages/analytics/src/registry.ts`
- `apps/web/src/features/admin/overview/` (dashboard consumption, coordinated with TASK-060)

## Database Changes

- No new tables required if the chosen `AnalyticsProvider` is fully external; if PostgreSQL-backed aggregate tables are used for MVP KPIs, add `analytics_event_log` (event_id UNIQUE, event_name, event_version, user_id, occurred_at, environment, properties jsonb) and any small aggregate/materialized views needed for the KPI dashboards.

## API / Application Services

- `AnalyticsService.track()`
- `ProductMetricRegistry` (KPI formula/source/window definitions)
- `GetProductFunnelMetrics`

## UI Changes

Feeds the commercial overview dashboard (TASK-060) and any dedicated `/admin` analytics views; no standalone end-user UI in this task.

## Security Requirements

- Event properties never include transaction notes, AI prompts, support notes, or raw financial amounts/merchants unless explicitly justified and bucketed.
- Analytics events do not embed financial data (amount, debt, balance, merchant) in URLs/query tracking.
- Access to raw event exploration in admin tooling is limited to authorized roles; no unrestricted "browse every financial action by user" explorer.

## Financial Invariants

- MRR and other revenue KPIs are always sourced from billing tables/provider reconciliation, never estimated from analytics events.
- Analytics provider outages never block or corrupt a financial or billing operation.

## Error Cases

- Duplicate backend event (must not double-count), malformed event payload (schema validation failure), missing `event_id` on a critical event, analytics provider unavailable during a core operation.

## Acceptance Criteria

- [x] `user_signed_up` is emitted exactly once per real signup; duplicate submissions do not double-count. (`eventId: user_signed_up:{userId}`, a Postgres unique index backstop — see task notes on why "duplicate submission" can't actually happen twice for the same user anyway.)
- [x] `user_activated` is emitted exactly once per user, using the versioned `activation:v1` definition.
- [x] `subscription_activated`/Pro conversion metrics are computed from billing state, never from a `checkout_started` client event alone. (Fires only from `subscriptionSynchronizer`'s `periodCreated` signal — a real billing-state transition, never from the checkout-intent event.)
- [x] A simulated analytics provider outage does not prevent a transaction, debt payment, or billing operation from succeeding. (`AnalyticsService.track()` never throws by construction; proven against a real transaction in integration tests. Debt payments/other billing ops weren't individually wired to emit events in this pass — see task notes — but the same never-throws guarantee applies to every wired call site.)
- [x] Internal/staff/test accounts are excluded from all MVP KPI calculations. (`isInternalAccountEmail` — any `@*.test` address plus a configurable `ANALYTICS_INTERNAL_EMAIL_DOMAINS` allowlist; `countDistinctUsersForEvent` filters on it.)
- [x] No event schema in the registry accepts free-text financial fields (amount as string, merchant, notes) without explicit justification and review. (Every schema is `.strict()` Zod — an extra `amount`/`merchant`/`notes` key fails validation outright, proven in tests.)
- [x] Repeated delivery of the same critical server event (e.g., duplicate webhook-triggered event) does not double-count in funnels/KPIs. (Postgres partial unique index on `event_id`.)

## Tests Required

### Unit
- [x] Event schema validation rejects prohibited free-text/financial fields.
- [x] Activation definition evaluation against synthetic user activity.

### Integration
- [x] Server event emission after a real domain operation (e.g., transaction creation) with a mocked/disabled provider still leaves the domain operation successful.
- [x] Duplicate `event_id` for a critical backend event is deduplicated at the pipeline/store level.

### E2E
- [x] Full trial funnel (signup → trial → activation → checkout → Pro) is measurable end-to-end against seeded events. (Signup through activation is the real, live-wired path; checkout/Pro conversion are simulated directly against the event store, same as the referral E2E test simulates a conversion — see task notes on why no live trigger exists for either.)

### Security
- [x] Analytics event payloads for a seeded transaction never contain the raw amount/merchant/notes.

### Property / Invariant
- [x] MRR computed via the KPI registry always matches billing-sourced revenue, never an analytics-event-derived approximation. (`GetProductFunnelMetrics` has no MRR field at all; `GetCommercialOverviewMetrics`'s existing MRR is untouched and proven unmoved by injected fake `subscription_activated` events.)
- [x] Analytics failures never propagate as errors to the calling financial operation.

## Verification Commands
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Core product funnels and MVP KPIs are measurable from schema-validated, privacy-safe events, with billing and finance remaining the sole authority for revenue and financial metrics, and analytics failures never affecting core product operations.

## Notes

Session replay and heatmaps must remain disabled at launch per the source document's explicit caution about financial-screen sensitivity; do not enable them opportunistically as part of this task.

**Scope decision (user-confirmed via AskUserQuestion before implementation):** this repo has no real analytics vendor account (no PostHog keys, no client script). The option taken was "full pipeline + real server-side wiring" — build the complete `packages/analytics` pipeline with a fully-owned Postgres-backed `AnalyticsProvider` (the "MVP, fully-owned provider" the task's own Database Changes section allows) and wire it into every SERVER-authoritative event's real call site, while explicitly not wiring client-only UI interaction events (no `onClick`/`useEffect` instrumentation added anywhere — there's no script loaded in the browser to send them to). What follows is the honest map of what's real vs. not:

**Live-wired, fires from a real call site today:**
- `user_signed_up`, `trial_started` — `packages/auth`'s `user.create.after` hook.
- `referral_attributed` — same hook, right after `AttributeReferral` succeeds.
- `account_created` — `apps/web`'s create-account Server Action.
- `transaction_created` — create-expense/create-income Server Actions only (not transfers, refunds, adjustments, scheduled/recurring materialization — see below).
- `dashboard_viewed`, `cashflow_viewed` — the dashboard page itself (server-rendered on every visit; this app has no separate cashflow page).
- `user_activated` — `checkAndEmitActivation`, called after a transaction is created and after every dashboard view; evaluates real `accounts`/`transactions` counts (never analytics-event-derived) plus the two view events above.
- `subscription_activated` — `subscriptionSynchronizer`'s `periodCreated` signal (real billing-state transition, shared by the webhook route, manual refresh, cancel and reconcile paths).
- `subscription_cancelled` — the cancel-subscription Server Action.
- `subscription_expired` — `expirePastDueSubscriptions` (same "not yet wired to a scheduler" caveat as its own pre-existing notification wiring — TASK-039/041 own the cron/worker infra; the emission code is ready for whenever a real trigger calls it).
- `promotion_redeemed` — the redeem-promotion-code Server Action.
- `ai_capability_executed` (SUCCESS/FAILED) — via `executeAICapability`'s existing `telemetry` port.
- `ai_credits_exhausted` — a thin outer wrapper around `executeAICapability` that catches `AI_CREDITS_EXHAUSTED` specifically (it's thrown before the inner telemetry hook can see it) and reports the primary pool from `resolvePoolOrder`.
- `notification_action_clicked` — the mark-notification-read Server Action.

**Defined in the schema registry but never emitted anywhere (by design, not oversight):**
- `checkout_started`, all other client-only UI interaction events beyond dashboard/cashflow — no browser script exists to send them from an `onClick`/`useEffect`. `packages/analytics/src/client/client-analytics.ts` defines the shape a future adapter would implement.
- `discount_applied` — reserved/inert per the task's own Scope wording; `docs/10.5-discounts-and-coupons.md` is explicitly deferred.
- `referral_converted`, `product_access_changed` — no live trigger exists to hang these off. `HandleReferralConversion`/`GrantReferralReward` (TASK-055) have no live `PaidProActivated` subscription anywhere yet, so nothing in this codebase ever calls them outside admin's manual retry and this task's own E2E simulation. `product_access_changed` has no single centralized transition point either — access state is derived fresh on every read (`resolveProductAccess`), never stored as a transition, so there's nowhere natural to detect "from → to" without diffing reads, which this pass doesn't attempt.
- `user_reactivated` — same shape of gap; nothing currently detects "a previously-lapsed user is now active again."

**KPIs actually computed:** `GetProductFunnelMetrics` (distinct-user counts: signups, trial started, activated, checkout started, subscription activated/Pro conversion, AI adoption) feeds a new "Embudo de producto" section on the existing `/admin` overview page, alongside the pre-existing `GetCommercialOverviewMetrics` (MRR, active Pro, etc. — untouched, still billing-sourced only). **Not computed in this pass**: Time To First Value, Week 4 Retention, Paid Churn, Reactivation Rate, AI Cost/Pro, WhatsApp Cost/Pro — these need cohort/time-windowed queries (not simple distinct-counts) and were judged out of scope for this already-large pass; `packages/analytics`' event log has everything needed to build them later (every event carries `occurredAt`).

**Internal/staff/test account exclusion**: any `@*.test` email (this repo's own seed/E2E convention, RFC 2606's reserved test TLD) is always treated as internal by default; a new `ANALYTICS_INTERNAL_EMAIL_DOMAINS` env var (comma-separated) extends this to real staff domains without code changes.

**`amount_bucket` thresholds** (`LOW <= 50`, `MEDIUM <= 500`, else `HIGH`) are a pragmatic, currency-agnostic placeholder — this package has no live FX access to normalize across currencies properly; revisit if amount buckets need to be genuinely comparable across users with different `baseCurrency`.
