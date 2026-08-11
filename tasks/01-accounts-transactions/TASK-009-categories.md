# TASK-009 — Implement category management vertical slice

## Status

DONE

## Phase

Phase 1 — Accounts + Categories + Transactions

## Priority

P1

## Depends On

- TASK-007

## Source Documents

- AGENTS.md
- docs/05-mvp-roadmap.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/07-ui-system.md

## Objective

Permitir crear, renombrar, archivar y seleccionar categorías privadas de ingreso/gasto.

## Scope

- Category repository/service/action/schema.
- Optional default user-owned categories during onboarding.
- Parent relationship validation and category settings UI.

## Out of Scope

- Global catalogs, advanced tags, transaction splits and AI categorization.

## Domain Rules

- Category type must match transaction type.
- Archived categories remain historical but are unavailable for new records.

## Implementation Notes

Use `apps/web/src/features/categories` and `settings/categories`; keep defaults user-owned.

## Expected Files

- `apps/web/src/app/(app)/settings/categories/`
- `apps/web/src/features/categories/`
- `packages/db/src/repositories/categories.ts`

## Database Changes

Use existing categories schema; add constraints/indexes only through migration if required.

## API / Application Services

- `CreateCategory`, `UpdateCategory`, `ArchiveCategory`, `ListCategories`.

## UI Changes

- Category management and filtered selectors.

## Security Requirements

- Category ownership checked server-side.

## Financial Invariants

- No cross-user category relation.

## Error Cases

- Empty/duplicate name policy.
- Type mismatch, archived category, non-owned parent.

## Acceptance Criteria

- [x] User can manage private income and expense categories.
- [x] Archived category appears in history but not new forms.
- [x] Parent category ownership/type is validated.

## Tests Required

### Unit

- [x] Type/parent validation.

### Integration

- [x] Ownership and archive behavior.

### E2E

- [x] Create category and use it as a parent in the category form via authenticated E2E.

### Security

- [x] User A cannot use User B category.

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Category lifecycle and selectors work without allowing incompatible or foreign categories.

## Notes

Keep hierarchy shallow; no closure table in V1.
