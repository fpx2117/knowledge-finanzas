# 08 — API Contract Audit

## Forma actual de la "API"

No hay una API REST/RPC pública. La superficie de comando/consulta es:

1. **Next.js Server Actions** (`"use server"`) en `features/<dominio>/actions/*.ts`.
   Patrón observado (ej. `transfers/actions/transfer-actions.ts`):
   `requireCurrentUser()` → `zodSchema.parse(formData)` → `service.method(user, input)` →
   `revalidatePath(...)` (lista manual de paths) → `redirect(...)` | `{ ok:false, error: mapErrorToUi(e) }`.
2. **Route handlers** en `app/api/**` sólo para: auth (`[...all]`), health, webhooks (mercadopago/resend/twilio), SSE de notificaciones.
3. **Services** en `features/<dominio>/services/*.ts` — read models y orquestación; llamados desde Server Components (lectura) y desde actions (escritura).

## Inventario de actions (comando)

| Feature | Archivos | Semántica |
|---|---|---|
| accounts | `features/accounts/actions` | CRUD cuenta |
| transactions | `create-transaction`, `void-transaction`, `pending-review-actions`, `duplicate-review-actions`, `recurring-detection-actions`, `subscription-detection-actions`, `classification-rule-actions` | **COMMAND** (create/void) + resolución de pendientes/duplicados + detección |
| transfers | `transfer-actions` (`createTransferAction`, `voidTransferAction`) | **COMMAND** atómico |
| debts | `debt-actions` | crear deuda, registrar pago, allocation |
| goals | `goal-actions` | CRUD + aporte/retiro |
| budgets | `features/budgets/actions` | CRUD budget |
| categories | `features/categories/actions` | CRUD categoría / mapping |
| capture | `quick-actions` | Registrar (delega a owners) |
| imports | `features/imports/actions` | subir, previsualizar, confirmar batch |

## Hallazgos

### A-1 — Sin idempotency key en commands financieros · **CRITICAL** (§38)
`createTransactionAction` / `createTransferAction` / pago de deuda no aceptan ni persisten `commandId`.
Un doble-submit o retry por timeout crea duplicados. **Ya señalado en 02 (L-5/T-4) y 07 (D-1).**
Contrato objetivo: cada action de mutación C-nivel acepta `idempotencyKey` (del cliente, uno por intento
de submit), lo propaga al service, y el service hace upsert-o-devuelve-existente.

### A-2 — Invalidación por `revalidatePath` hardcodeado · **RESUELTO 2026-09-04**
Cada action listaba los paths a mano. Frágil: encontramos que `void-transaction.ts` directamente
**olvidaba `/budgets`** (anular un gasto no actualizaba el consumo del presupuesto en pantalla).
**Fix:** `apps/web/src/lib/events/emit-financial-event.ts` — mapa único evento→paths (WP-EVENT-TAGS),
reemplazó ~85 llamadas en 16 archivos. Tags por-usuario (`revalidateTag`) quedan diferidos hasta que
la app adopte `unstable_cache` en sus páginas (hoy no existe esa capa — ver la nota de alcance en
`10-work-packages.md`).

### A-3 — CRUD sin semántica de dominio en algunos flujos · **MEDIUM**
Preferir operaciones de dominio explícitas sobre coordinación de múltiples escrituras desde el cliente:
- `POST /transfers` (una op atómica) ✅ ya es así (`createTransferService`).
- Pago de obligación: debe ser **una** op `registrarPago(obligationId, amount, source, allocationStrategy)`
  que crea el `LIABILITY_PAYMENT` + allocations + actualiza outstanding atómicamente. Verificar que
  `debt-actions` no expone pasos sueltos.
- Refund: `POST /transactions/:id/refunds` conceptual — verificar que `create-transaction` con
  `type: REFUND` + `originalTransactionId` valida el remanente refundable server-side
  (`calculateRemainingRefundable`).
- Corrección de categoría: op única que además emite la señal de aprendizaje (CM-09).

### A-4 — Validación y ownership · **PARTIAL / verificar**
`requireCurrentUser()` + `zod.parse` presentes en todas las actions vistas. Ownership de recursos
referenciados (accountId, categoryId, debtId pertenecen al user) se valida en el **service** — confirmar
que **ningún** service confía en un ID del formData sin chequear pertenencia (suite IDOR cubre 6 dominios;
faltan goals/scheduled/recurring/imports).

### A-5 — Idempotencia de webhooks · ✅
`billing_webhook_events` + verificación de firma + fetch del recurso al proveedor (TASK-034). Resend/Twilio
webhooks con logging estructurado. MP `x-request-id` preservado por middleware (bug corregido en TASK-040).

### A-6 — Error model · ✅ / verificar cobertura
`mapErrorToUi` + `packages/shared/errors` + `lib/errors`. Verificar que los errores financieros nunca se
colapsan en un toast genérico (anti-pattern #9) y que exponen código público para Ayuda (§DoD 14).

### A-7 — Rate limits · **PARTIAL**
Better Auth rate limiter en sign-in/up/reset + 60/min webhook por IP (in-memory, sin Redis). **Falta**
rate limit en actions financieras sensibles y en import (§26.8).

### A-8 — Exportación · UNVERIFIED
§28 exige que export de datos sobreviva a downgrade. Verificar que existe export de transacciones
(P0 §40) y protección contra CSV formula injection (§26.7).

## Contrato mínimo para nuevas actions de mutación financiera

```
input:  { ...domainFields, idempotencyKey: string }
guard:  requireCurrentUser() → assertOwnership(allReferencedIds, user)
domain: pure validation (packages/finance) → single DB transaction
effect: emitFinancialEvent(event)  // tags + observability (commandId, requestId)
out:    { ok: true, id } | { ok: false, error: PublicError }  // nunca 200 con éxito falso (anti-pattern #9, §performance optimistic UI)
```
