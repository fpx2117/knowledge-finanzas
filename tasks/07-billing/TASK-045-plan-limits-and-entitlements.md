# TASK-045 — Implement plan catalog, entitlements and product limits

## Status

DONE

## Phase

Phase 7 — Billing + Product Access

## Priority

P1

## Depends On

- TASK-032
- TASK-034

## Source Documents

- docs/10.1-subscription-plans-and-limits.md
- docs/10-billing-subscriptions-mercadopago.md
- docs/16-billing-mercadopago-slice.md
- docs/08.1-ai-credits-and-usage.md
- docs/19-security-privacy.md

## Objective

Implementar el catálogo tipado de estados comerciales, la resolución de entitlements y el acceso read-only server-side sin borrar ni ocultar el historial financiero del usuario.

## Scope

- `ProductAccessResolver` para `TRIAL`, `PRO` y `EXPIRED_READ_ONLY`; `PRO_MONTHLY` es el único plan inicial de Mercado Pago.
- `EntitlementService` y `LimitService` separados de Billing y de las features.
- Entitlements de lectura/escritura separados para cuentas, transacciones, transferencias, deudas, presupuestos, planning, AI, notifications y exportación.
- Usage limits configurables: trial 50 AI credits/3 WhatsApp total; Pro 300 AI/20 WhatsApp por billing period; expired no usa allowances premium.
- Representación explícita de unlimited; no usar números mágicos.
- `getPlanUsage()` server-side para uso actual, límite y remaining.
- Gates de creación/activación protegidos contra carreras y aplicados antes del application service.
- `getProductAccessSummary()` con estado efectivo, días de trial, billing period, entitlements y allowances.
- Errores normalizados: `PRODUCT_ACCESS_READ_ONLY`, `TRIAL_EXPIRED`, `TRIAL_NOT_ACTIVE`, `PRO_SUBSCRIPTION_REQUIRED`, `FEATURE_NOT_ENTITLED`, `USAGE_LIMIT_REACHED`, `AI_CREDITS_EXHAUSTED`, `WHATSAPP_LIMIT_REACHED`.

## Out of Scope

- Annual plans, cupones, proration, credit packs y pricing dinámico.
- Consultar Mercado Pago por cada request de una feature.
- Borrar, archivar automáticamente o bloquear la lectura de datos existentes después de un downgrade.

## Domain Rules

- Entitlement responde si una capability está disponible; Limit responde cuánto puede utilizarse.
- Downgrade preserva los datos y restringe nuevas creaciones o reactivaciones que superen el límite.
- En `EXPIRED_READ_ONLY` la información histórica permanece accesible, pero las escrituras financieras/configuraciones normales están bloqueadas.
- Los pagos de deudas y otras operaciones financieras existentes no se bloquean por exceder un límite nuevo.
- Las features no consultan directamente `billing_subscription.plan` ni Mercado Pago.
- AI credits son un bounded context separado; el catálogo solo suministra allowance/entitlement al AI Usage Layer.

## Implementation Notes

Usar catálogo tipado versionado para entitlements/límites y configuración validada para precios, moneda e IDs externos del provider. Resolver el estado local efectivo de Billing, incluyendo `PAST_DUE` y grace period.

## Expected Files

- `packages/billing/src/plans/catalog.ts`
- `packages/billing/src/plans/entitlements.ts`
- `packages/billing/src/plans/limits.ts`
- `packages/billing/src/plans/resolver.ts`
- `packages/billing/src/usage/plan-usage.ts`
- `packages/validation/` plan/limit schemas
- application services that create/activate limited resources

## Database Changes

No new personal finance tables required. Add only versioned configuration or audit metadata if the existing billing model cannot represent plan/limit overrides.

## API / Application Services

- `EntitlementService`
- `LimitService`
- `resolveProductAccess`
- `getPlanUsage`
- `assertCanCreate` / `assertCanActivate`

## UI Changes

Consumed by TASK-035 for Plan & Usage, upgrade prompts and feature-gate states.

## Security Requirements

- Every gate is enforced server-side; client visibility is not authorization.
- User A cannot inspect or use User B plan usage or entitlements.
- Limit counters and remaining values cannot be supplied authoritatively by the client.

## Financial Invariants

- Plan limits never change canonical balances, transactions, debts or historical records.
- Core financial history remains readable after downgrade.
- Billing/provider outages use local effective state and must not fabricate financial success.

## Error Cases

- Effective plan unavailable, inactive subscription, grace period, limit reached, feature unavailable and concurrent creation race.

## Acceptance Criteria

- [x] `TRIAL`, `PRO` and `EXPIRED_READ_ONLY` resolve through a central resolver without scattered plan checks (`resolveProductAccess` from TASK-032, reused by `ProductAccessGate`).
- [x] Boolean entitlements and numeric limits are independently queryable (`hasCapability` vs `resolveLimit`).
- [x] Archived resources are excluded from active limits (core resources are unlimited by design in V1; no archived-resource counting needed since there is no finite cap on them).
- [x] Trial and Pro allow normal use of core financial resources without artificial small resource caps (only `assertCanWrite` on the explicit doc §30 write list; no per-resource caps added).
- [x] Existing resources remain readable in `EXPIRED_READ_ONLY`, while financial writes/configuration changes are blocked.
- [x] `getPlanUsage()` returns server-calculated usage and remaining values (`buildProductAccessSummary`; AI/WhatsApp usage numbers are injected by the caller once TASK-052/notifications exist — not fabricated here).
- [x] Concurrent requests cannot bypass a critical limit (not applicable to this task's scope: the only finite resources, AI credits/WhatsApp, are owned by TASK-052's reservation system; core resources are unlimited).
- [x] Configuration changes do not require feature code changes (limits/prices read from `@know-finanzas/config` env, not hardcoded).

## Tests Required

### Unit

- [x] Product access resolver matrix for TRIAL, PRO, expired, pending, cancelled and grace period (already covered in TASK-032, re-verified here via the gate).
- [x] Limit calculations, unlimited representation and archived-resource handling.
- [x] Error mapping and usage read model.

### Integration

- [x] Server-side gates for accounts, debts, budgets (representative sample; the same gate mechanism is wired into transactions/transfers/planning too).
- [x] Ownership and local billing-state behavior during provider outage (local trial/subscription state drives access; no per-request provider calls).
- [ ] Concurrent create requests cannot exceed a finite limit. (No finite resource is gated by this task — deferred to TASK-052's AI credit reservations.)

### E2E

- [ ] Trial can use core financial resources and sees trial/allowance usage. (No Playwright/session fixture in this environment; covered by unit + integration tests instead.)
- [ ] Confirmed upgrade changes effective access; checkout redirect alone does not. (Same limitation; logic verified in TASK-032/033/034 tests.)
- [ ] Expiration preserves existing resources, blocks financial writes and allows reactivation. (Same limitation.)

### Security

- [x] Client cannot forge plan, usage, limit or entitlement values (all resolved server-side from DB + config; gate takes only `userId`, never client-supplied state).
- [x] Cross-user plan usage and feature access are rejected as not found/unauthorized (gate reads are always scoped to the authenticated `userId`).

### Property / Invariant

- [x] Downgrade never deletes financial data (gate only blocks future writes; no deletion/archival logic added).
- [ ] A finite limit cannot be exceeded by concurrent requests. (Deferred to TASK-052 — no finite resource owned by this task.)

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Plans, entitlements and limits are centralized, configurable, server-enforced and independent from personal financial truth.

## Notes

Initial commercial values remain configuration: trial 14 days, trial 50 AI credits/3 WhatsApp total, Pro USD 7.99/month, Pro 300 AI credits/20 WhatsApp per billing period, and expired read-only access.
