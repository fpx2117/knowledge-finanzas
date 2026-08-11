# TASK-062 — Implement optional statistical profile, analytics consent and internal privacy-controlled aggregation pipeline

## Status
DONE

## Phase
Phase 16 — Data Analytics, Privacy & Monetization

## Priority
P3

## Depends On
- TASK-003
- TASK-028
- TASK-061

## Source Documents
- docs/23-data-analytics-privacy-and-monetization.md
- docs/19-security-privacy.md
- docs/22-product-analytics.md

## Objective

Construir, de forma completamente separada de la analítica de producto y del ledger financiero, un perfil estadístico opcional, un modelo de consentimiento explícito por propósito, y un pipeline interno de agregación con umbrales de privacidad — sin habilitar ninguna comercialización externa de datos en esta task.

## Scope

- `user_statistical_profiles` (age_range, employment_status, income_range, household_size_range, region_code, y campos futuros opcionales nullable) — cinco variables iniciales, todas opcionales, con `Prefer not to say` donde corresponda; nunca requerido para usar el producto financiero.
- `analytics_consents` y `analytics_consent_history` (append-only `GRANTED`/`WITHDRAWN`) por `purpose` (`product_analytics`, `external_aggregated_statistics`) y `policy_version`; consentimiento explícito, default `false`, sin pre-checked, separado de la aceptación de términos.
- Withdrawal flow desde Settings → Privacidad y datos: tras retiro, ningún dato nuevo del usuario ingresa al pipeline elegible para agregación externa; ya-anonimizados históricos no requieren (ni pueden garantizar) retroactividad.
- Derived financial metrics (savings rate, debt service ratio, housing cost ratio, expense category ratios) calculadas exclusivamente reutilizando el Finance Engine existente (TASK-028 y semántica de transferencias/reembolsos/ajustes), nunca reimplementando semántica de transacciones ad-hoc.
- Pipeline: `Personal Finance PostgreSQL → Eligibility/Consent Filter → Privacy Analytics Staging → Metric Derivation → Generalization/Bucketing → Aggregation → Privacy Thresholds → Disclosure Risk Checks`. En esta task el pipeline termina en agregados internos versionados; no produce ni publica ningún dataset externo.
- Minimum-cohort-size suppression (`MIN_EXTERNAL_COHORT_SIZE`, configurable, conservative default e.g. 100) — cualquier cohorte por debajo del umbral se marca `SUPPRESSED` y nunca se expone, ni siquiera internamente en vistas agregadas.
- No persistent individual identifier in aggregate output tables; pseudonymous staging identifiers (`analytics_subject_id`) are explicitly documented as pseudonymous, never labeled anonymous.
- Admin aggregate view (`/admin` → Analytics/Data Products, authorized roles only) showing consented users, profile completion, eligible statistical population, suppressed cohort count — no user-level explorer for the commercial team.
- Progressive, skippable profile completion prompt after the user has already received value (not at signup); default recommendation: after first 5–10 transactions or first meaningful dashboard.

## Out of Scope

- Any external dataset generation, release, sale, or delivery (`statistical_data_products`, `statistical_dataset_releases`, buyer contracts, API); the source document explicitly recommends **not** enabling external commercialization at launch, and doing so requires a dedicated legal/privacy review gate that is out of scope for this task.
- Differential privacy, k-anonymity tooling beyond simple threshold suppression, data clean rooms.
- User-facing peer benchmarks ("your spending vs similar users") — a plausible V1.1 follow-up, not required here.

## Domain Rules

- `Pseudonymized Data != Anonymous Data`; a hashed/random `user_id`/`analytics_subject_id` is always treated as pseudonymous (personal data) while a linkage capability exists.
- `Consent != Terms Acceptance`; analytics consent is a separate, explicit, revocable action.
- `Statistical Profile != Core Product Requirement`; every field is optional and the core financial product functions identically with an empty profile.
- `Derived Financial Metric != Non-Personal Data`; a computed ratio tied to a user remains personal data until properly aggregated and thresholded.
- Free text (transaction notes, AI prompts, support notes) and merchant names are excluded from this pipeline entirely, not just from the (out-of-scope) external product.
- Small cohorts are suppressed; rare category combinations are generalized or excluded, at every stage of the pipeline, not only at final export.
- Test/staff/demo accounts and fraudulent accounts are excluded from the eligible statistical population.

## Implementation Notes

Keep `user_statistical_profiles`/`analytics_consents` logically and physically separate from `packages/finance` and the transaction ledger; this pipeline reads from finance/analytics source views with minimized fields, never joining directly against raw production tables from ad-hoc admin/analyst queries. Use synthetic fixtures for any development/testing of the aggregation pipeline; never clone production financial data into a lower environment.

## Expected Files

- `packages/privacy/src/statistical-profile/`
- `packages/privacy/src/consent/`
- `packages/privacy/src/pipeline/` (eligibility filter, metric derivation, generalization, aggregation, threshold suppression)
- `packages/db/src/schema.ts`
- `apps/web/src/features/privacy/components/` (statistical profile form, consent toggle)
- `apps/web/src/features/admin/analytics/` (aggregate-only admin view)

## Database Changes

- `user_statistical_profiles` (user_id, age_range, employment_status, income_range, household_size_range, region_code, updated_at).
- `analytics_consents` (id, user_id, purpose, status, policy_version, granted_at, withdrawn_at, created_at).
- `analytics_consent_history` (id, user_id, purpose, action, policy_version, occurred_at) append-only.
- `analytics_cohort_metrics` (period, region_bucket, age_bucket, income_bucket, employment_bucket, metric_code, cohort_size_bucket, median_value, p25_value, p75_value, privacy_version) — internal aggregates only, no `user_id` column.

## API / Application Services

- `SaveStatisticalProfile`
- `UpdateAnalyticsConsent`
- `GenerateCohortAggregate:v1` (versioned internal job)
- `GetAdminAggregateAnalyticsSummary`

## UI Changes

- Settings → Privacidad y datos: statistical profile form (all fields optional, "Prefer not to say"), consent toggle with plain-language explanation and withdrawal action, consent receipt (granted date, status, policy version).
- Admin aggregate-only analytics summary view.

## Security Requirements

- Statistical profile and consent endpoints authenticate and scope strictly to the current user.
- Analytics staging/aggregation pipeline access is more restricted than normal product queries; no ad-hoc analyst access to raw transaction tables.
- Cohort aggregates below `MIN_EXTERNAL_COHORT_SIZE` are never returned by any query path, including internal admin views.
- No dark patterns in consent UI (no oversized accept button, no hidden decline, no guilt wording).

## Financial Invariants

- Core finance functionality never depends on statistical profile completion or analytics consent.
- Consent withdrawal never deletes or alters actual financial records; it only affects future eligibility for the (out-of-scope) external pipeline.
- Declining statistical/analytics consent never reduces product access, changes pricing, or unlocks/locks any feature (no paywalling privacy).

## Error Cases

- Attempt to require a statistical profile field to proceed with onboarding/core features (must be rejected by design/tests), consent withdrawal while pipeline is mid-run, cohort below suppression threshold requested by any consumer.

## Acceptance Criteria

- [x] User can complete, partially complete, or entirely skip the statistical profile without any impact on core product access.
- [x] Analytics consent defaults to off, is explicit, and is stored with `purpose`, `status`, `policy_version`, `granted_at`/`withdrawn_at`.
- [x] Withdrawing consent stops the user's future data from entering new aggregation runs; existing already-anonymized aggregates are not required to be (and are documented as not being) retroactively rebuilt.
- [x] A cohort with fewer members than `MIN_EXTERNAL_COHORT_SIZE` is always returned as `SUPPRESSED`, including in the admin aggregate view.
- [x] No aggregate table or query result contains a `user_id`, `accountId`, `transactionId`, or hashed user identifier.
- [x] Derived metrics (savings rate, debt service ratio, etc.) match the Finance Engine's semantics for transfers, refunds, and adjustments (no double counting, no transfers counted as spending). (savings_rate and debt_service_ratio only — see task notes on why housing_cost_ratio/expense_category_ratios aren't implemented.)
- [x] Admin analytics view shows only aggregate counts/completion rates, never a per-user financial explorer.

## Tests Required

### Unit
- [x] Consent state transitions (`GRANTED`/`WITHDRAWN`) and history append-only behavior.
- [x] Cohort threshold suppression logic.

### Integration
- [x] Withdrawal excludes the user from the next aggregation run.
- [x] Statistical profile fields all accept `null`/`PREFER_NOT_TO_SAY` and onboarding/core flows remain unaffected.
- [x] Derived metrics computed via this pipeline match the Finance Engine's transfer/refund/adjustment semantics on a seeded dataset.

### E2E
- [x] User completes onboarding leaving the entire statistical profile empty; core product works normally.
- [x] User opts into analytics consent, later withdraws it from Settings, and the consent receipt reflects the withdrawal.

### Security
- [x] A commercial/support-role admin cannot query down to an individual user's derived financial metrics via the analytics admin view. (The admin summary service's repository port structurally has no per-user method at all — proven by a unit test asserting the response shape.)
- [x] Free text and merchant names never appear in any staging or aggregate row.

### Property / Invariant
- [x] No returned cohort ever has fewer members than the configured minimum.
- [x] No aggregate output row is traceable to a single individual through any exposed field.

## Verification Commands
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Users can optionally contribute a statistical profile and explicit, revocable consent, and an internal pipeline can produce threshold-suppressed, non-identifying aggregate metrics — with no external dataset, sale, or commercialization capability enabled by this task.

## Notes

External statistical data products, buyer contracts, and any commercialization require a dedicated legal/privacy review gate per the source document (section 260) and are intentionally left for a future task once this governance/pipeline foundation exists and has been validated. Do not build the external release/publish surface as part of this task.

**`housing_cost_ratio`/`expense_category_ratios` are not implemented.** This app's categories are
free-text and user-defined (`categories.name` is arbitrary text, `categories.type` is only
INCOME/EXPENSE) with no canonical taxonomy anywhere in the schema — there's no "this category
means housing" concept to reuse. Computing either ratio would require inventing a classification
(e.g. matching category names against a hardcoded housing-keyword list), which is exactly the
ad-hoc transaction-semantics reimplementation the task's own Implementation Notes forbid
("nunca reimplementando semántica de transacciones ad-hoc"). `savings_rate` (income vs.
`classifyLedgerEffect`-derived consumption) and `debt_service_ratio` (against the real,
already-canonical `debt_payments` table) are implemented because both reuse an existing,
unambiguous concept rather than inventing one.

**Every categorical column (`age_range`, `employment_status`, `income_range`,
`household_size_range`, `region_code`, consent `purpose`/`status`) is Postgres `text`, not
`pgEnum`** — same reasoning as `analytics_event_log` (TASK-061): this session hit real
transaction-ordering pitfalls adding new `pgEnum` labels (see TASK-055's Notes), and these value
sets are exactly the kind likely to grow. Validity is enforced at the application layer by
`packages/privacy`'s Zod schemas instead.

**`income_range` is a self-reported, currency-agnostic qualitative bucket** (`LOW` .. `HIGH`),
not an absolute-amount range — this app supports multiple currencies/base currencies per user, so
there's no single meaningful absolute threshold to bucket against. **`region_code` is ISO 3166-1
alpha-2** (a real country code) rather than a hardcoded province/state list, to avoid overfitting
the schema to one country.

**`GenerateCohortAggregate:v1` is not wired to a scheduler** — same "TASK-039/041 own the real
cron/worker infrastructure" gap as `expire-past-due-subscriptions.instance.ts`
(`apps/web/src/lib/billing/`). It's exposed as `apps/web/src/lib/privacy/
generate-cohort-aggregate.instance.ts`, itself a thin wrapper around a pure-DI factory
(`apps/web/src/features/privacy/services/generate-cohort-aggregate.ts`) so a future scheduled
trigger, and this task's own integration tests (which run against an isolated test database, not
the app's global `db` connection), can both construct it against the right database.

**Progressive profile prompt threshold**: shown on the dashboard once a user has ≥5 real
transactions and has never dismissed it before (`user_statistical_profiles.prompt_dismissed_at`),
matching the source document's default recommendation. It is never shown at signup.
