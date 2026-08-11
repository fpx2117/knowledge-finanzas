# Runbook: External Provider Outage

**Owner:** whoever holds the Railway project credentials (see `runbooks/README.md`).

Covers Mercado Pago, OpenRouter (AI), Resend (email), and Twilio (WhatsApp). None of these ever
factor into `/api/health` or `/api/health/live` (`docs/18-production-readiness.md` §39-40: "AI is a
capability opcional," "no consultar Mercado Pago en cada health check") — the app itself never
reports unhealthy because of a provider outage. `/api/health/deep` reports whether a capability is
*configured*, not whether the provider is currently reachable.

## Detection

- Structured logs (`packages/observability`, wired into the webhook routes and billing's own error
  paths) show repeated `webhook_processing_failed`/`webhook_processing_unexpected_error` entries
  for one `provider`, or a spike in `BILLING_PROVIDER_ERROR`/AI provider errors surfaced to users.
- The admin reconciliation queue (`/admin/billing/reconciliation`, from TASK-060) accumulates
  stale-PENDING subscriptions faster than usual.

## Immediate actions

Per provider, this codebase already degrades gracefully — the runbook step is mostly "confirm the
existing degradation is working, not build a new one":

- **Mercado Pago down:** `StartProSubscription` (`packages/billing/src/subscriptions/`) writes a
  local `PENDING` row *before* calling the provider; on provider failure it releases that row
  (`markFailed`) so the user isn't left in limbo and can retry once the provider recovers. Existing
  `ACTIVE` subscriptions are entirely unaffected (billing access resolution is local-state-driven,
  never a live provider call — see `resolveProductAccess`). Set `BILLING_NEW_SUBSCRIPTIONS_ENABLED`
  to `false` if new-subscription attempts are failing loudly enough to be worth suppressing the CTA
  entirely until the provider recovers.
- **OpenRouter (AI) down:** AI capability execution (`executeAICapability`,
  `packages/ai/src/credits/execute-capability.ts`) reserves credits, calls the provider, and
  releases the reservation on failure — never consumes a credit for a failed call. Set `AI_ENABLED`
  (and/or `AI_CATEGORIZATION_ENABLED`) to `false` to disable the feature entirely if failures are
  frequent enough to be worse than the feature being off.
- **Resend (email) / Twilio (WhatsApp) down:** `notifyUser` (`apps/web/src/lib/notifications/
  notify.ts`) always persists the in-app notification first and only *attempts* the email/WhatsApp
  send afterward, inside a `try/catch` that never lets a send failure propagate back — a provider
  outage here degrades to "no email/WhatsApp for a while," never a lost or duplicated notification.

## Rollback

Not applicable in the usual sense — there is no deploy to roll back for a third-party outage. The
"rollback" is disabling the affected capability flag (above) and re-enabling it once the provider
recovers; no code change or redeploy needed for a flag toggle in Railway's environment variables.

## Safe-write behavior

- Never manually mark a `PENDING` subscription as `ACTIVE`, or manually credit AI credits/WhatsApp
  allowance, to work around a provider outage — `docs/18-production-readiness.md`'s Domain Rule
  applies here directly: "external outages do not fake financial success."
- Once the provider recovers, run the existing reconciliation flow
  (`createReconcileSubscriptions`, exposed via `/admin/billing/reconciliation`) rather than
  hand-editing any `PENDING`/failed rows — it re-queries the provider and only ever writes what the
  provider actually confirms.

## Postmortem

Record: provider, duration, how many affected requests/users, and whether the existing
release/retry/reservation pattern held up as designed or needs a follow-up fix.
