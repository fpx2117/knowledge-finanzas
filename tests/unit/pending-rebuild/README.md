# pending-rebuild

Unit tests for feature slices that were removed during the greenfield frontend rebuild
and have **not been rebuilt yet**. They are excluded from `vitest` runs (see
`vitest.config.ts` / `vitest.unit.config.ts` `exclude`) so `pnpm test` reflects the code
that actually exists.

Each file here targets a deleted module:

| test | removed module |
|------|----------------|
| `admin-commercial-user-summary` | `features/admin/users/services/get-admin-commercial-user-summary` |
| `admin-overview-metrics` | `features/admin/overview/services/get-commercial-overview-metrics` |
| `admin-reconciliation-queue` | `features/admin/billing/services/get-reconciliation-queue` |
| `admin-search-users` | `features/admin/users/services/search-admin-users` |
| `billing-page-service` | `features/billing/services/billing-page-service` |
| `billing-service` | `features/billing/services/billing-service` |
| `evaluate-financial-alerts` | `features/notifications/services/evaluate-financial-alerts` |
| `money-input-formatting` | `components/financial/money-input-format` |
| `notification-related-route` | `features/notifications/lib/resolve-related-route` |
| `notification-templates` | `features/notifications/lib/templates` |
| `notification-toast-policy` | `features/notifications/lib/toast-policy` |
| `onboarding-route` | `features/onboarding/services/resolve-onboarding-route` |
| `onboarding-schemas` | `features/onboarding/schemas/onboarding-schemas` |
| `onboarding-service` | `features/onboarding/services/onboarding-service` |
| `privacy-admin-summary` | `features/admin/analytics/services/get-admin-aggregate-analytics-summary` |
| `referral-invitation-status` | `features/referrals/queries/get-referral-summary` |
| `suggest-category-service` | `features/transactions/services/suggest-category-service` |
| `suggest-merchant-service` | `features/transactions/services/suggest-merchant-service` |

**When rebuilding one of these features:** move its test back to `tests/unit/`, update the
import path to the new module location, and adapt to the new API.
