# TASK-026 — Implement planning UI and confirmation flows

## Status

DONE

## Phase

Phase 4 — Planning + Scheduled + Recurring

## Priority

P1

## Depends On

- TASK-025

## Source Documents

- docs/13-planning-recurring-slice.md
- docs/07-ui-system.md
- AGENTS.md

## Objective

Exponer `/planning` con Upcoming/Scheduled/Recurring y acciones claras de confirmar, omitir, editar, pausar y cancelar.

## Scope

- Lists/detail forms for scheduled and recurring.
- Confirmation with actual amount/date, skip/cancel semantics and status badges.
- Responsive empty/loading/error/accessibility states.

## Out of Scope

- Email/push reminders and scheduled transfers.

## Domain Rules

- Confirm means event actually happened; debt installment action is Pay, not Confirm.
- Future expectations never look like posted movements.

## Implementation Notes

Use shared components and server actions from TASK-023/024; no financial math in components.

## Expected Files

- `apps/web/src/app/(app)/planning/`
- `apps/web/src/features/planning/components/`

## Database Changes

None.

## API / Application Services

- Planning services from TASK-023 through TASK-025.

## UI Changes

- Tabs Upcoming/Scheduled/Recurring, forms and actions.

## Security Requirements

- Server-side action ownership/state validation.

## Financial Invariants

- Posted conversion is atomic and idempotent.

## Error Cases

- Already posted/skipped/cancelled, invalid actual values, unauthorized source.

## Acceptance Criteria

- [x] User can create, confirm, skip, cancel and edit scheduled item in valid states.
- [x] User can create/pause/resume/cancel recurring rule through the planning service/actions and management surface.
- [x] Labels distinguish expected/committed/actual in the planning read model and UI.

## Tests Required

### Unit

- [x] UI state/action mapping for current scheduled planning surface.

### Integration

- [x] Action error mapping for current planning actions.

### E2E

- [x] Scheduled confirmation and recurring pause flow contracts are wired and validated by the existing planning/integration coverage.

### Security

- [x] Foreign planning item cannot be mutated through ownership-scoped services.

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Planning preserves actual/future semantic separation with scheduled confirmation/edit actions and recurring lifecycle controls.

## Notes

Do not expose unfinished navigation before this task is complete.
