# Runbook: Webhook Incident

**Owner:** whoever holds the Railway project credentials (see `runbooks/README.md`).

Covers `/api/webhooks/mercadopago`, `/api/webhooks/resend`, `/api/webhooks/twilio`.

## Detection

- Structured logs (`packages/observability`) show a spike in `webhook_invalid_signature` entries
  for one `provider` — either the provider rotated its signing secret (and the corresponding env
  var — `MERCADOPAGO_WEBHOOK_SECRET`/`RESEND_WEBHOOK_SECRET`/Twilio's `TWILIO_AUTH_TOKEN` — wasn't
  updated to match) or someone is probing the endpoint without valid credentials.
- A flood of requests to a webhook path returns `429` — `apps/web/src/middleware.ts`'s per-IP
  rate limit (60 req/min per IP+path) has kicked in. This is expected, working behavior under
  abusive traffic, not itself an incident to "fix."
- `webhook_processing_unexpected_error` entries indicate a real bug in the processing path, not a
  signature/traffic issue.

## Immediate actions

1. **Invalid-signature spike:** check whether the provider's webhook secret was recently rotated
   (in their dashboard) without the matching env var being updated here. If so, update the env var
   and redeploy — no data was lost, since an unverified webhook is rejected (`401`) before any
   state is written, never processed with unverified data.
2. **Rate-limit spike (`429`):** confirm via logs whether this is a real provider retry storm (e.g.
   Mercado Pago redelivering many events at once — a normal, retryable-failure pattern already
   handled by `packages/billing/src/webhooks/process-webhook.ts`'s `retryable` distinction) or
   actual abuse from an unrelated source IP. A real provider is never rate-limited into silent data
   loss: MP retries a webhook it didn't get a `2xx` for, so a `429` just delays that delivery, it
   doesn't drop it.
3. **Unexpected processing errors:** read the logged `errorMessage` and the specific webhook event
   row in the database (`billing_webhook_events` for Mercado Pago) — every webhook processor
   persists the event before/during processing, so the raw payload is recoverable for replay even
   if a bug caused processing to fail.

## Rollback

A webhook processing bug is a code bug — roll back to the last known-good deploy
(`runbooks/failed-deploy.md`'s rollback section applies identically here). Once rolled back, replay
any missed events:

- **Mercado Pago:** `createRetryWebhookEvent` (`packages/billing`), exposed via the admin
  reconciliation dashboard (`/admin/billing/reconciliation`, TASK-060) — re-processes a persisted
  webhook event row idempotently.
- **Resend/Twilio:** these providers retry failed deliveries on their own schedule; once the bug is
  fixed and redeployed, their own retry will succeed without any manual replay needed here.

## Safe-write behavior

- Every webhook processor is idempotent on the provider's own event/delivery ID (duplicate
  delivery of the same event is a no-op, not a double-write) — this already holds and doesn't need
  to be re-verified per incident.
- Never manually construct and POST a synthetic webhook payload against production to "test" a fix
  — always replay a real, previously-received event (see Rollback above) so the exact payload that
  actually caused the issue is what's re-verified.

## Postmortem

Record: which provider, root cause (secret rotation / abuse / code bug), whether any real events
were permanently lost (should be never, given idempotent persistence-before-processing), and update
this runbook if a new failure mode was discovered.
