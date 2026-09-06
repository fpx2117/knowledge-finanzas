# Quarantined integration tests (WP-B8-RECONCILE, 2026-09-06)

The greenfield frontend rebuild deleted the **app layer** of several subsystems
(`apps/web/src/features/{onboarding,admin,billing,notifications,privacy,referrals,promotions,planning}`
— 0 files each) while the **domain logic** in `packages/*` survived. These test files import the
deleted app-layer code, so they can't compile. They are parked here (not deleted) so they can be
restored when each subsystem's UI/wiring is rebuilt.

`vitest.integration.config.ts` only includes `tests/integration/**`, so nothing here runs.

| File | Subsystem | What it covered — restore when that subsystem is rebuilt |
|---|---|---|
| `onboarding.test.ts` | onboarding | step machine, resume, basic/financial/privacy profile persistence |
| `admin-core.test.ts` | admin | admin role resolution, audit-entry recording, user search |
| `admin-operations.test.ts` | admin | credit adjustment, webhook retry, refund request, reconciliation queue |
| `billing-start-subscription.test.ts` | billing | start-subscription flow + entitlement grant |
| `analytics.test.ts` | analytics/privacy | event log, consent history, cohort metrics |
| `privacy-pipeline.test.ts` | privacy | statistical-profile → cohort-aggregate generation pipeline |
| `business-metrics.test.ts` | admin/analytics | commercial overview metrics aggregation |
| `product-funnel-metrics.test.ts` | admin/analytics | activation funnel metrics |
| `notification-rules.test.ts` | notifications | financial-alert rule evaluation → notification intent |
| `referral-ui.test.ts` | referrals | referral summary query + invitations list |

## Still-covered elsewhere (no coverage gap)

- Cross-user IDOR on debts/budgets/accounts/transactions/transfers → `security-idor-and-concurrency.test.ts` + `ownership-repositories.test.ts`.
- Debt-payment concurrency / idempotency → `debt-payment-idempotency.test.ts`, `anti-double-count.test.ts`.
- The `packages/*` domain logic these tested still has its own package-level unit tests under `tests/unit/*` (e.g. `ai-*`, billing/notifications/privacy package tests).
