# TASK-031 — Implement budget UI, alerts and dashboard integration

## Status

DONE

## Phase

Phase 6 — Budgets

## Priority

P2

## Depends On

- TASK-030
- TASK-029

## Source Documents

- docs/15-budgets-slice.md
- docs/07-ui-system.md

## Objective

Permitir configurar y revisar presupuestos con estados y alertas in-app sin usar color como único significado.

## Scope

- `/budgets`, `/budgets/[budgetId]`, creation/edit/archive.
- Spent/limit/remaining/usage and contributing movements/refunds.
- Deduplicated near-limit/exceeded alert events and dashboard summary.

## Out of Scope

- Email/push, rollover and AI recommendations.

## Domain Rules

- Budget alerts are threshold state, not reminders or obligations.
- Budget values never subtract from spendable.

## Implementation Notes

Use numeric labels with progress bars as secondary; revalidate after expense/void/refund/category changes.

## Expected Files

- `apps/web/src/app/(app)/budgets/`
- `apps/web/src/features/budgets/components/`
- notification/alert integration.

## Database Changes

Optional alert identity storage `(budgetId, period, alertType)` if existing notification foundation is absent.

## API / Application Services

- Budget services and deterministic alert evaluation.

## UI Changes

- Budget cards/detail/form, empty/loading/error and dashboard status.

## Security Requirements

- Server-side ownership and no client-only feature gate.

## Financial Invariants

- Displayed breakdown matches budget engine.

## Error Cases

- Duplicate budget, archived category, exceeded/negative remaining, query failure.

## Acceptance Criteria

- [x] NORMAL/NEAR_LIMIT/EXCEEDED is visible by text/status.
- [x] Alert crossing is deduplicated per period/type.
- [x] Detail lists contributing expenses/refunds.
- [x] Dashboard shows secondary budget status only.

## Tests Required

### Unit

- [x] Alert threshold transitions.

### Integration

- [x] Recalculation after mutations.

### E2E

- [ ] Create budget and exceed it. (not automated — no Playwright auth fixture in this env; verified logic via unit/integration tests instead)

### Security

- [x] Foreign budget cannot be viewed/edited.

### Property / Invariant

- [x] Alert deduplication is idempotent.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Budget UX is understandable, responsive and consistent with transaction classification.

## Notes

No chart/bar-only UI.
