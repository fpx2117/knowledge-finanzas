# Quarantined E2E specs

`playwright.config.ts` has `testDir: "./tests/e2e"`, so nothing here runs. Specs are parked
(not deleted) to be restored when the UI they drive is rebuilt.

## WP-B8-RECONCILE (2026-09-06) — subsystems deleted in the greenfield rebuild

`access-selection`, `admin`, `admin-operations`, `analytics-funnel`, `billing`, `notifications`,
`onboarding`, `privacy`, `promotions`, `referrals` + the 7 `*-visual-review` specs. Each drives a
route tree (`/onboarding/*`, `/admin/*`, `/elegir-acceso`, `/settings/{plan,privacy,referrals}`…)
that the rebuild stubbed with `RebuildingNotice` or removed. Restore alongside each subsystem's
product+design WP.

## WP-E2E-JOURNEYS (2026-09-06) — specs written against the pre-rebuild UI

| File | Why parked | Where the invariant is still covered |
|---|---|---|
| `accounts.spec.ts` | Uses `chooseCombobox()` for "Tipo"/"Moneda" (now native `<select>`), expects accounts as `<heading>` (now links in a table), and `ARS 1.000,00` inline formatting. Every test times out on the first combobox. | Account creation + opening balance + income/expense from the UI + same-currency transfer as one movement → `tests/e2e/journeys.spec.ts`. ARS/USD kept separate → `tests/integration/dashboard-service.test.ts` + WP-DASHBOARD-SPEC01. Installment preview / confirm reviewed debt → `security-idor-and-concurrency.test.ts`, `debt-payment-idempotency.test.ts`. |
| `dashboard.spec.ts` | Same-era selectors; drives debt-payment + scheduled-confirm through the old dashboard DOM. | Debt payment reduces debt summary + spendable without double-counting → `tests/integration/anti-double-count.test.ts` (real Postgres, production wiring). Scheduled-confirm updates totals → `tests/integration/dashboard-service.test.ts`. |

Restoring these = rewriting them against the rebuilt UI (native selects, table layout, `MoneyAmount`
component), which belongs to an Accounts/Dashboard E2E WP, not to WP-E2E-JOURNEYS.

## Live E2E specs (`tests/e2e/`)

`journeys.spec.ts` (3 critical financial journeys), `final-route-regression.spec.ts` (every
canonical authenticated route renders with one `<h1>` + labeled controls, desktop + mobile),
`final-accessibility-audit.spec.ts` (structural a11y contracts), `a11y-keyboard.spec.ts`
(WP-A11Y / G4 — skip link, keyboard-driven command palette, register a movement without a
mouse, native validation moving focus, dialog focus trap + restore).
