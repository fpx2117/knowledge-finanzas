# TASK-046 — Establish pricing and unit economics controls

## Status

DONE

## Phase

Phase 9 — Production + Business Operations

## Priority

P2

## Depends On

- TASK-032
- TASK-036
- TASK-040

## Source Documents

- docs/10.2-pricing-unit-economics.md
- docs/10.1-subscription-plans-and-limits.md
- docs/08.1-ai-credits-and-usage.md
- docs/18-production-readiness.md

## Objective

Crear configuración, métricas y alertas operativas para revisar pricing, costos variables y contribution margin sin convertir el modelo económico en fuente de verdad del estado de billing.

## Scope

- Validated pricing and unit-economics configuration separated from domain financial calculations.
- Metrics for gross subscription revenue, gateway fees, net payment revenue, AI cost, WhatsApp cost, infrastructure allocation and contribution.
- Trial economics: trial starts, trial cost, Trial → Pro conversion, retained Pro users and expired users.
- Distinction between assumed gateway rate and actual provider fee when available.
- AI cost monitoring by provider, model, capability, plan, tokens and credits consumed.
- WhatsApp cost monitoring by plan, delivery status and provider cost when available.
- Configurable guardrails for AI cost per PRO user, WhatsApp cost per PRO user, gateway fee and contribution margin.
- Monthly operational review data for MRR, conversion, churn, ARPU, LTV/CAC inputs and contribution margin.
- Reference scenario calculations for 100 Pro users, including approximately USD 574.10 estimated contribution before overhead under the documented assumptions.

## Out of Scope

- Automated pricing changes, dynamic model pricing or automatic plan state changes.
- Tax/accounting treatment, payroll, legal advice and final profit reporting.
- Public business metrics dashboard or admin console unless separately approved.
- Charging personal finance users for core accounts, transactions, balances, debt payments or transfers.

## Domain Rules

- Listed price, net payment revenue, contribution margin and net profit are different concepts.
- Product credits are not provider tokens; provider cost is not a user-facing credit price.
- Planning assumptions such as gateway rate and target costs are not technical invariants.
- Provider costs and pricing configuration must not be hardcoded in finance/domain logic.
- Rising external costs may reduce AI/WhatsApp allowances or premium scope before limiting core finance.

## Implementation Notes

Use structured operational metrics with no raw financial descriptions. Keep provider cost telemetry separate from AI credit accounting. Store configuration versions when changing cost assumptions so historical reports remain explainable.

## Expected Files

- `packages/config/src/pricing.ts`
- `packages/observability/src/business-metrics.ts`
- `packages/observability/src/cost-guardrails.ts`
- billing/AI/notification metric adapters
- operational runbook for monthly pricing review

## Database Changes

No financial ledger changes. Optional append-only business metric snapshots may be added if existing telemetry retention is insufficient.

## API / Application Services

- Pricing/config resolver for plan catalog.
- Business metric aggregation/query contract.
- Cost guardrail evaluation and alert emission.

## UI Changes

None for the public product. An internal dashboard remains out of scope unless separately approved.

## Security Requirements

- Business metrics are admin-only and do not expose user financial history or raw AI prompts.
- Provider credentials, pricing secrets and internal costs never enter client bundles.
- Metric dimensions are minimized and ownership is irrelevant only for aggregate admin data.

## Financial Invariants

- This task cannot activate, cancel or change a user's subscription.
- Business metrics never alter personal account balances or financial transactions.
- Gateway fees are platform costs, not user personal expenses.

## Error Cases

- Missing/invalid pricing configuration, unavailable provider cost, stale aggregation, threshold breach and metric sink outage.

## Acceptance Criteria

- [x] Pricing and plan assumptions are validated centrally and are not hardcoded in features. `packages/config/src/pricing.ts` — a Zod-validated schema, never imported by `packages/finance` or any domain/ledger code.
- [x] Gross, net and contribution metrics are independently represented. `UnitEconomicsSnapshot`'s `revenue.grossSubscriptionRevenue`/`revenue.netPaymentRevenue`/`contribution.contributionMargin` are three separate fields, never collapsed — proven by a dedicated test asserting all three differ.
- [x] Assumed gateway fee is distinguishable from actual provider fee. `revenue.assumedGatewayFeeTotal` is always computed; `revenue.actualGatewayFeeTotal` is `null` unless a real figure is supplied (nothing in this codebase captures one today — see Notes).
- [x] AI and WhatsApp usage costs are observable by capability/plan without raw sensitive content. `getBusinessMetrics` aggregates real `ai_credit_entries`/`notification_deliveries` rows into counts/sums only — never a raw prompt, message body, or transaction description.
- [x] Trial cost and Trial → Pro conversion are represented separately from Pro revenue. `UnitEconomicsSnapshot.trial` is its own top-level field, computed independently of `revenue`.
- [x] The documented 100-Pro reference scenario can be reproduced from configuration and exact decimal formulas. `tests/unit/business-metrics.test.ts` reproduces ~USD 574.10 exactly from the default `PricingConfig` and `decimal.js` arithmetic.
- [x] Guardrail alerts exist for cost-per-PRO and contribution-margin thresholds. `packages/observability/src/cost-guardrails.ts`'s `evaluateCostGuardrails` — AI cost/PRO user, WhatsApp cost/PRO user, gateway fee rate, and contribution margin/PRO user, all configurable.
- [x] Metric failures cannot block or mutate core financial operations. `getBusinessMetrics` is a separate, read-only query path never called from any write service — a failure here cannot possibly affect an unrelated ledger write.
- [x] Configuration/version changes preserve explainability of historical metric calculations. Every `PricingConfig` carries a `version` (`PRICING_CONFIG_VERSION`), and every `UnitEconomicsSnapshot` records `pricingConfigVersion` — narrowed: no historical snapshot *storage* was built (Database Changes explicitly says "no financial ledger changes... optional append-only snapshots" — left as a follow-up since nothing yet calls this on a schedule to snapshot; see Notes).

## Tests Required

### Unit

- [x] Pricing formula, gateway fee, net revenue and contribution calculations using exact decimal arithmetic. `tests/unit/business-metrics.test.ts` (16 tests, `decimal.js` throughout, zero floating point).
- [x] Guardrail thresholds and configuration validation. Same file — guardrail breach/no-breach cases; `parsePricingConfig` rejection cases.
- [x] Assumed versus actual fee mapping. Covered in the same file (`calculateRevenue` with/without `actualGatewayFeeTotal`).

### Integration

- [x] AI, billing and notification telemetry feeds aggregate metrics without raw context. `tests/integration/business-metrics.test.ts` — real `ai_credit_entries`/`billing_subscriptions`/`notification_deliveries` rows aggregated into the snapshot, verified against hand-computed expected sums.
- [x] Metric sink outage does not affect financial or billing writes. Structural, not a specific failure-injection test: `getBusinessMetrics` has no write path and no caller in any write service — there is nothing for a "sink outage" to interact with on the write side. (No metric *sink* — log/telemetry emission destination — was built in this task; the "sink" language in the task's own Implementation Notes refers to the general observability sink concept TASK-040 already established, reused here only implicitly since business metrics currently return a snapshot to the caller rather than being logged through `packages/observability`'s logger.)

### E2E

None required for the initial operational foundation.

### Security

- [x] Non-admin users cannot access aggregate business metrics. `getBusinessMetrics` calls `requirePermission(actor.role, "commercial.metrics.read")` first, before any query — proven to reject `null` and `SUPPORT` roles without ever touching the database.
- [x] No secrets, prompts or full transaction descriptions appear in metric payloads. Every query is a `count`/`sum` aggregate — no row-level content (descriptions, prompts, message bodies) is ever selected, let alone returned.

### Property / Invariant

- [x] Gross revenue is not equalized with net revenue or contribution by implementation shortcut. Explicit test in `tests/unit/business-metrics.test.ts`.
- [x] Business metric calculation never mutates financial state. Integration test verifies row counts are identical before/after a `getBusinessMetrics` call; structurally guaranteed anyway since every query in the service is a `SELECT`.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Pricing and unit economics are measurable, configurable and auditable, with cost guardrails that cannot compromise core financial correctness.

## Notes

Initial planning assumptions are configurable examples: PRO price USD 7.99, gateway rate 10%, AI target USD 0.60/PRO, WhatsApp target USD 0.30/PRO, infrastructure allocation USD 0.40/PRO and other costs USD 0.15/PRO. These are not guarantees or financial invariants.

**What was built:**
- `packages/config/src/pricing.ts`: Zod-validated `PricingConfig` (price, assumed gateway rate,
  assumed AI-cost-per-credit, assumed WhatsApp-cost-per-message, per-PRO-user cost targets, and
  four configurable guardrail thresholds), versioned via `PRICING_CONFIG_VERSION`. Defaults match
  the task's own documented assumptions exactly.
- `packages/observability/src/business-metrics.ts`: pure `decimal.js` calculators
  (`calculateRevenue`, `calculateCosts`, `calculateContribution`, `calculateTrialEconomics`,
  `buildUnitEconomicsSnapshot`) — none of them touch a database; they operate purely on
  already-aggregated counts, keeping this package DB-free like every other module in it.
- `packages/observability/src/cost-guardrails.ts`: `evaluateCostGuardrails`, read-only threshold
  evaluation over an already-computed snapshot.
- `apps/web/src/features/admin/business-metrics/services/get-business-metrics.ts`: the real
  aggregation layer — queries `billing_subscriptions` (active PRO count), `ai_credit_entries`
  (CONSUMPTION sums, including trial-pool-scoped), `notification_deliveries` (WhatsApp
  SENT/DELIVERED counts), and `users` (trial start/conversion/expiry counts), feeds them into the
  pure calculators, and evaluates guardrails. Gated by a new `commercial.metrics.read` permission
  (`packages/shared`), granted to ADMIN/SUPER_ADMIN only — `requirePermission` runs before any
  query, so a non-admin caller never touches the database at all.
- `runbooks/monthly-pricing-review.md`: how to read every figure in the snapshot, what a guardrail
  breach should (and should not) trigger, and the configuration-versioning discipline.

**Domain Rules held throughout:** finance/domain logic (`packages/finance`, the transaction/debt/
transfer services) never imports anything from `packages/config/src/pricing.ts` or
`packages/observability` — this is a fully separate, additive read path. `getBusinessMetrics` has
no write capability at all (every query is a `SELECT`), so it structurally cannot activate, cancel,
or change a subscription, nor mutate any account balance.

**Narrowed scope, documented honestly:**
- **No "actual" AI/WhatsApp provider cost figure exists** — only the assumed-cost-per-unit ×
  real-usage figures this task's Domain Rule explicitly frames as the norm ("product credits are
  not provider tokens; provider cost is not a user-facing credit price"). If a real OpenRouter/
  Twilio billing feed is ever integrated, it would populate a genuine "actual" cost figure the same
  way `actualGatewayFeeTotal` is already structured to accept a real Mercado Pago fee once that
  feed exists — neither currently does.
- **No admin UI/dashboard** — the task's own UI Changes section says this stays out of scope
  "unless separately approved." `getBusinessMetrics` is a fully real, callable, tested application
  service; wiring it into an actual admin page is a follow-up, not attempted here.
- **No append-only historical snapshot storage** — the task's own Database Changes section frames
  this as optional ("if existing telemetry retention is insufficient"). Nothing currently calls
  `getBusinessMetrics` on a schedule, so there's no accumulating history to store yet; the
  `pricingConfigVersion` field on every snapshot is what will make such storage explainable once it
  exists.
- **MRR/ARPU/LTV/CAC as fully-computed headline metrics** are not separately built — the task's
  Scope asks for "monthly operational review **data**... for MRR, conversion, churn, ARPU, LTV/CAC
  **inputs**," and `UnitEconomicsSnapshot`/`getBusinessMetrics` provide exactly those inputs
  (subscriber counts, conversion counts, revenue figures); composing them into the named headline
  ratios is straightforward from here but wasn't built as its own function, since no consumer of
  those specific ratios exists yet.
