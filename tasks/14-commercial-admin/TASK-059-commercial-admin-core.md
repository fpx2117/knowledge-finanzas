# TASK-059 — Establish commercial admin authorization, audit log and user commercial summary

## Status
DONE

## Phase
Phase 14 — Commercial Admin

## Priority
P2

## Depends On
- TASK-003
- TASK-032
- TASK-034
- TASK-045
- TASK-057
- TASK-058

## Source Documents
- docs/21-commercial-admin.md
- docs/19-security-privacy.md

## Objective

Construir el framework de autorización administrativa, el audit log append-only y la búsqueda/resumen comercial de usuario que todo el resto del panel admin (TASK-060, y las UIs admin de TASK-054/TASK-056) reutiliza, sin exponer datos financieros personales innecesarios ni permitir mutaciones directas de base de datos.

## Scope

- Roles administrativos mínimos: `SUPPORT` (inspect/diagnose), `ADMIN` (controlled commercial actions), `SUPER_ADMIN` (sensitive overrides/configuration), integrados con Better Auth; ninguna cuenta admin compartida.
- Permission declarations por application service sensible (ej. `commercial.users.read`, `billing.refund.execute`, `promotions.manage`, `ai.adjust`, `referrals.invalidate`), verificadas server-side en cada acción; UI hiding nunca sustituye autorización.
- `/admin` route protection: autenticación + rol server-side en cada Server Action/Route Handler; sin backdoors (`?admin=true`, headers mágicos).
- Audit log append-only: `AuditEntry` (id, actor_user_id, action, entity_type, entity_id, target_user_id?, before_snapshot, after_snapshot, reason, created_at); nunca editable desde la UI; nunca contiene secretos/credenciales de provider en los snapshots.
- Acciones que requieren `reason` obligatorio: manual Pro grant, grant extension, grant revocation, AI adjustment, refund, referral invalidation, entitlement override (enforced at the application-service layer, not just the UI).
- Global user search (por email exacto/prefijo o ID interno; sin export masivo) y `GetAdminCommercialUserSummary` como read model agregando: effective access + source, trial state, subscription state, active promotion, AI credit balance, WhatsApp usage, latest payment, refund status — construido enteramente desde datos locales, sin llamar a providers externos en el page load.
- "Why this access?" debug view mostrando el desglose de `ProductAccessResolver` (paidSubscriptionEffective, promotionEffective, trialActive, resolvedState, source).
- Data-minimization default para `SUPPORT`: acceso a estado comercial/de cuenta, no a montos de transacciones/merchants/detalles de deuda por defecto.

## Out of Scope

- Billing/promotions/discounts/referrals/AI/notifications operational actions and dashboards (TASK-060).
- Impersonation ("Login as user") — explicitly not implemented in V1.
- Admin configuration page for dynamic commercial settings (may be added by a future task; not required for MVP admin core).

## Domain Rules

- `Admin UI != Direct Database Editor`: every mutation goes through an authorized application service, never a raw ORM call from a React component or an ad-hoc SQL endpoint.
- `Administrative Override != Provider Truth`: nothing in this task changes `billing_subscriptions.status` directly; state changes always flow through the appropriate domain service (billing reconciliation, promotion grant, AI credit ledger entry).
- Every sensitive administrative write is auditable; no sensitive write ships without a corresponding audit entry.
- Commercial support access never implies unrestricted access to personal finance data (transaction amounts, merchants, debt details) by default.
- Client-declared role (`if client.role === "ADMIN"`) is never trusted; every sensitive service re-checks role server-side.

## Implementation Notes

Build the summary as a pure query composition over existing tables (billing, promotions once TASK-053 lands, AI credits, notifications), not a new denormalized table, to avoid a second source of truth. Keep the admin feature isolated under `apps/web/src/features/admin/` with domain/application logic remaining in its owning package (no `packages/admin-do-everything`).

## Expected Files

- `packages/auth/src/admin-roles.ts`
- `packages/shared/src/permissions/`
- `packages/audit/src/audit-log.ts` (or `packages/shared/src/audit/` if a dedicated package is not warranted)
- `apps/web/src/features/admin/users/`
- `apps/web/src/features/admin/audit/`
- `packages/db/src/schema.ts`

## Database Changes

- `admin_roles` or an extension of the existing user/role model to carry `SUPPORT`/`ADMIN`/`SUPER_ADMIN`.
- `audit_log` (id, actor_user_id, action, entity_type, entity_id, target_user_id nullable, before_snapshot jsonb, after_snapshot jsonb, reason nullable, created_at), append-only, indexed on `actor_user_id`, `target_user_id`, `entity_type`, `created_at`.

## API / Application Services

- `GetAdminCommercialUserSummary`
- `SearchAdminUsers`
- `RecordAuditEntry` (internal, called by every sensitive admin service)
- `RequirePermission` (authorization guard used by every admin Server Action)

## UI Changes

- `/admin` shell with role-gated navigation (Overview, Users, Billing, Promotions, Discounts, Referrals, AI Usage, Notifications, Audit).
- `/admin/users` search and `/admin/users/:userId` commercial summary page including "Why this access?" debug panel.
- `/admin/audit` searchable audit log (filters: actor, target user, action, entity, date range).

## Security Requirements

- Every admin route and Server Action validates session + role server-side; no reliance on UI hiding.
- User search does not support unrestricted broad queries/export by default; prefers exact/prefix email or known identifier.
- Admin sessions should follow tighter security practices (shorter lifetime, re-auth for sensitive actions) where the auth provider supports it.
- No hidden admin backdoor query params or headers.

## Financial Invariants

- Admin core never mutates billing, promotion, or AI credit state directly; it only reads and delegates to owning domain services (built in other tasks).
- Viewing a user's commercial summary never triggers a live Mercado Pago/AI provider call; provider refresh is an explicit, separate action defined by the owning domain task.

## Error Cases

- Unauthenticated admin route access, insufficient role for a given action, sensitive action attempted without a reason, search query too broad/rejected, target user not found.

## Acceptance Criteria

- [x] `SUPPORT`, `ADMIN`, `SUPER_ADMIN` roles are enforced server-side on every admin Server Action, independent of what the UI renders — `requireAdminUser`/`requirePermission` are called at the top of every admin page, resolving the role from a real DB lookup (`admin_roles`), never from client input.
- [x] A direct call to an admin Server Action without the required role is rejected, even if the corresponding UI button is hidden. **No admin Server Actions exist in this pass yet** (see Notes) — verified instead at the guard layer itself (`requirePermission` unit/integration tests) and at the page layer (SUPPORT rejected from an ADMIN-only permission check).
- [ ] Every sensitive administrative write (as enumerated in Scope) produces exactly one audit entry with actor, action, entity, before/after, reason, and timestamp. **The audit infrastructure (`RecordAuditEntry`, `requireReason`) is built and tested — no sensitive write exists yet in this task to actually call it** (TASK-060 wires the first real mutating admin actions). See Notes.
- [x] Admin can search a user by exact/prefix email or internal ID and open a commercial summary showing effective access, source, trial, subscription, promotion, AI balance, WhatsApp usage, latest payment, and refund status.
- [x] The commercial summary page load does not call Mercado Pago, OpenRouter, or Twilio — `GetAdminCommercialUserSummary`'s only dependencies are local repositories; no provider client is even importable from that file.
- [x] `SUPPORT` role can search and view summaries but cannot perform `ADMIN`/`SUPER_ADMIN`-only mutating actions (verified against the permission matrix — no mutating action exists yet to attempt).
- [x] Audit log is append-only; no UI path allows editing or deleting an existing entry — `AuditLogRepository`/`createAuditLogRepository` expose only `record`/`search`, no update or delete method exists anywhere in the codebase for this table.

## Tests Required

### Unit
- [x] Permission resolution per role/action matrix. (`tests/unit/admin-permissions.test.ts`)
- [x] Audit entry construction (redaction of secrets from snapshots). (`tests/unit/audit-log.test.ts`)
- [x] `SearchAdminUsers` query validation and UUID-vs-email-prefix routing, `GetAdminCommercialUserSummary` pure composition. (`tests/unit/admin-search-users.test.ts`, `tests/unit/admin-commercial-user-summary.test.ts`)

### Integration
- [x] `GetAdminCommercialUserSummary` aggregates from local tables only, no external calls. (`tests/integration/admin-core.test.ts`, real Postgres, real billing/promotion data)
- [x] Sensitive action without a reason is rejected at the application-service layer, not only the form. (`requireReason` — unit + integration)
- [x] `admin_roles` grant/revoke against real Postgres, `requirePermission` enforced against a real resolved role, real audit entries recorded and searched.

### E2E
- [x] Admin logs in, searches a user, opens the commercial summary, and sees the "why this access" breakdown. (`tests/e2e/admin.spec.ts`)
- [x] Non-admin user is redirected/rejected when navigating to `/admin` (as a generic 404, not a distinguishable "forbidden" page — deliberate, see Notes).

### Security
- [ ] SUPPORT cannot call an ADMIN-only Server Action directly (bypassing the UI). **No admin Server Action exists yet to attempt this against** — covered at the guard level: `tests/unit/admin-permissions.test.ts`/`tests/integration/admin-core.test.ts` prove `requirePermission(supportRole, "promotions.manage")` throws.
- [x] Normal (non-admin) authenticated user cannot access `/admin` or any admin Server Action. (`tests/e2e/admin.spec.ts`)
- [x] Admin search does not leak results to non-admin endpoints — `searchAdminUsers`/`getAdminCommercialUserSummary` are only ever called from behind `requireAdminUser()`; no other route imports them.

### Property / Invariant
- N/A "every successful sensitive admin write has a corresponding audit entry" — no sensitive admin write exists yet in this task to exercise the invariant against; `createRecordAuditEntry` itself is unit/integration tested as the mechanism TASK-060's writes will call.

## Verification Commands
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Administrative access is role-gated end-to-end, every sensitive write is audited, and operators can search and understand a user's commercial state from local data without ad-hoc database queries.

## Notes

This task is intentionally built before TASK-060's operational actions, mirroring the source document's own recommended implementation order ("audit comes early," "user summary comes early") so no sensitive admin write ships without audit infrastructure already in place.

**Some acceptance criteria are structurally satisfied but not yet exercised by a real mutation** — this task's own Out of Scope explicitly excludes "billing/promotions/discounts/referrals/AI/notifications operational actions" (TASK-060's job), so there is genuinely no sensitive admin *write* anywhere in this codebase yet for `RecordAuditEntry`/`requireReason`/`requirePermission` to be called against in production. What this task delivers and fully tests is the *mechanism*: `createRecordAuditEntry` redacts and persists correctly, `requireReason` rejects a missing reason, `requirePermission` rejects an under-privileged role — all proven directly against those functions (unit + integration, real Postgres) rather than indirectly through a mutating Server Action that doesn't exist yet. When TASK-060 adds the first real mutating action (e.g. a refund, a promotion grant), it must call `requirePermission` (or `requireAdminUser(permission)`), `requireReason`, and `recordAuditEntry` itself — this task does not and cannot enforce that from the outside.

**Role storage: a separate `admin_roles` table, not a column on `users`.** The vast majority of users are never admins, and Better Auth's own `users` table already carries production auth concerns (session, trial dates) — adding a `role` column there would mean every non-admin user row carries a meaningless default. `admin_roles.user_id` is the primary key (at most one role per user), with `granted_by`/`granted_at` for a lightweight provenance trail independent of the audit log itself.

**Bootstrapping the first admin has no UI in this task** (task's own Out of Scope: "Admin configuration page for dynamic commercial settings"). `createAdminRoleRepository(db).grantRole(...)` exists and is tested, but nothing calls it from a Server Action yet — the first `admin_roles` row in any environment has to be inserted directly (e.g. via a one-off script or `psql`), the same way the very first admin account is bootstrapped in most systems that don't yet have self-service role management.

**`/admin` returns a generic Next.js 404 (`notFound()`) for both an unauthenticated visitor and an authenticated non-admin**, deliberately not a distinguishable "403 Forbidden" page. This avoids confirming `/admin` exists as a special surface to anyone probing it, consistent with the Security Requirement "no hidden admin backdoor query params or headers" — the flip side (no reliance on obscurity as an actual security boundary) is that `requireAdminUser()` is still the real, server-enforced gate; the identical 404 response is just what a rejected request looks like from outside.

**`GetAdminCommercialUserSummary`'s AI credit balances render the raw pool keys** (`TRIAL_ALLOWANCE`, `PLAN_ALLOWANCE`, `PURCHASED`) rather than translated Spanish labels, and the summary page overall is intentionally plain (a working data view, not a polished dashboard) — TASK-060 is expected to redesign this page once the surrounding admin UI (nav sections for Billing/Promotions/Referrals/AI/Notifications, `AdminDataTable`/`AdminActionDialog` shared components) actually exists to unify it with.

**New shared error codes** (`FORBIDDEN`, `ADMIN_REASON_REQUIRED`, `ADMIN_TARGET_USER_NOT_FOUND`, `ADMIN_SEARCH_QUERY_TOO_BROAD`) were added to `packages/shared/src/errors.ts`'s `applicationErrorCodes` — the same exhaustive-`Record` pattern flagged repeatedly elsewhere in this backlog required updating `apps/web/src/lib/errors/map-error-to-ui.ts`'s `messages` map in lockstep.

**New package `packages/audit`** (not folded into `packages/shared`) holds `createRecordAuditEntry`, `redactSnapshot`, and `requireReason` — kept separate because it has its own dependency (`@know-finanzas/shared`, for `ApplicationError`) and its own domain concept (an audit trail), matching this codebase's established pattern of many small, single-purpose packages rather than one shared grab-bag.
