# 10 — Work Packages

Formato por WP. Prioridad: **P0** (sin esto no hay producto financiero confiable) · **P1** (V1 completo) ·
**P2** (mejora fuerte) · **P3** (posterior). Etiquetas: `BLOCKER` `FINANCIAL-RISK` `SECURITY-RISK`
`UX-RISK` `TECH-DEBT`.

Sólo los WP de Fase 0 y A están totalmente desglosados (son el camino crítico). El resto se lista con
goal + dependencias + criterio; se desglosan al llegar a su fase.

---

## WP-000 — Recuperar Product Foundation  ·  P0  ·  ~~`BLOCKER`~~ **DONE (2026-09-03)**

- **Goal:** tener `docs/00-product-foundation.md` en el repo como autoridad de precedencia. ✅
- **Resultado:** el usuario colocó `docs/00-product-foundation.md` v1. Verificado consistente con
  spec 14 §4 (mismos 8 invariantes financieros, sin contradicciones). Aporta además: North Star +
  activación v1 (§15), criterio de priorización (§19), fuera de alcance explícito (§16: OCR, rollover
  de presupuestos, pagos mínimos de tarjeta, push/SMS, plan anual — WhatsApp sí en alcance), y §20
  que confirma que el `DONE` histórico del backlog **no** reemplaza validación actual.
- **Follow-up:** el primer slice ahora arranca en WP-IMPL-ADR-001.

---

## WP-IMPL-ADR-001 — Reconciliación de rutas y naming  ·  P0  ·  **DONE (2026-09-03)**

- **Goal:** una decisión escrita y única sobre paths canónicos. ✅
- **Resultado:** `docs/adr/ADR-IMPL-001-route-and-naming-reconciliation.md` (Accepted). Rutas en inglés
  = spec 14 §8 literal; `/app`, `/obligations/*`, `/transactions/transfers`, `/settings/imports`,
  `/settings/plan`; `/planning` y `/duplicados` se pliegan; filtros por query param. `04-route-registry.md`
  actualizado con la tabla "canónico decidido".
- **Ejecución:** WP-ROUTES-RENAME (abajo).

---

## WP-ROUTES-RENAME — Ejecutar ADR-IMPL-001  ·  P1  ·  `UX-RISK`

- **Goal:** el árbol `app/(app)/` y la navegación cumplen los paths canónicos de ADR-IMPL-001.
- **Dependencies:** ADR-IMPL-001 (hecho). **Hacer temprano** (frontend en reconstrucción — cada
  pantalla nueva sobre un path viejo agranda este WP). No bloquea WP-LEDGER-IDEMP; pueden ir en paralelo.
- **Files likely affected:**
  - `apps/web/src/app/(app)/` — mover: `dashboard→app`, `debts→obligations` (+ hijos),
    `transfers→transactions/transfers`, `transactions/{pendientes→pending, recurrentes→recurring,
    importaciones→settings/imports, duplicados→(pliega)}`, `planning/*→(pliega en transactions/recurring)`,
    `goals/[goalId]/editar→edit`, `settings/billing`+`billing→settings/plan`.
  - `apps/web/src/components/layout/nav-items.ts` + `MOBILE_NAV_ITEMS` — labels es-AR, hrefs canónicos,
    "Obligaciones" reemplaza "Deudas", quitar "Transferencias"/"Planning" como secciones.
  - Todos los `redirect()`, `revalidatePath()`, `<Link href>` internos y `useRouter().push`.
  - `middleware.ts` o `next.config` — redirects 308 de los paths viejos (`/dashboard`, `/debts/*`,
    `/transfers/*`, `/planning/*`, `/transactions/{pendientes,recurrentes,importaciones,duplicados}`,
    `/billing`, `/settings/billing`).
  - `tests/e2e/*` — actualizar todos los paths.
- **Backend work:** ninguno (sólo routing).
- **Frontend work:** el renombre + los 308 + reintroducir duplicados como `?view=duplicates` en
  `/transactions/pending` y programados en `/transactions/recurring`.
- **Tests:**
  - E2E: navegación por sidebar llega a cada ruta canónica.
  - E2E: cada path viejo responde 308 al canónico.
  - unit: `isNavItemActive` / `isNavChildActive` con los nuevos hrefs.
- **Acceptance criteria:** `04-route-registry.md` sin filas `RENAME`/`MISSING` por naming;
  `pnpm test:e2e` verde; sidebar coincide con spec 14 §7.
- **Financial invariants:** ninguno (routing).
- **Observability:** contador de hits a rutas 308 (para saber cuándo retirar los redirects).
- **DoD:** specs 03/05/11 y `nav-items.ts` citan spec 14 §7/§8 + ADR-IMPL-001; ningún path español activo.

---

## WP-LEDGER-IDEMP — Idempotencia de comandos financieros  ·  P0  ·  `BLOCKER` `FINANCIAL-RISK`

**Progreso:**
- ✅ **Incremento 1 — `transactions` create (2026-09-03).** Migración `0039_broken_marten_broadcloak.sql`
  (`transactions.command_id uuid` + índice único parcial `transactions_user_command_unique`).
  Repo `create` idempotente (short-circuit por `findByCommandId` + rescate de `23505` en carrera).
  `commandId` propagado: schema Zod → `create-transaction` action + form (`crypto.randomUUID()` por
  instancia) → `quickCreateTransactionAction` (Registrar global) + `quick-add` form (refresca la key
  por apertura de diálogo; el "registrar igual" de un duplicado reusa la misma).
  Tests: `tests/unit/transactions-service.test.ts` (+3), `tests/integration/transaction-idempotency.test.ts`
  (5, contra Postgres real, incluye la carrera concurrente). Unit 795 ✓, lint ✓, 0 nuevos errores de tsc.
  De paso: `tests/support/test-database.ts` `truncate … cascade` (la lista fija estaba desactualizada
  tras el rebuild — bloqueaba toda la suite de integración).
- ✅ **Incremento 2 — transfer application service (2026-09-04).** Migración `0040_fluffy_kitty_pryde.sql`
  (`transfers.command_id` + índice único parcial `transfers_user_command_unique`). Nuevo
  `packages/db/src/pg-errors.ts` (`isUniqueViolation`, compartido con `transactions.ts`).
  `createTransferService`: short-circuit por `findByCommandId` antes de abrir la transacción DB, y
  rescate por `23505` si dos requests concurrentes chocan en el índice (la transacción atómica ya
  existente de TASK-015 no cambió). `commandId` propagado: schema Zod → `createTransferAction` +
  `transfer-form` (`crypto.randomUUID()` por instancia). Tests: `tests/integration/transfer-idempotency.test.ts`
  (4, contra Postgres real, incluye la carrera concurrente — no hay unit test porque el servicio depende
  de `FOR UPDATE` real). Unit 795 ✓, lint ✓, 0 nuevos errores de tsc.
- ✅ **Incremento 3 — debt payment service (2026-09-04).** Migración `0041_ordinary_lady_bullseye.sql`
  (`debt_payments.command_id` + índice único parcial `debt_payments_user_command_unique`).
  `recordDebtPayment`: resuelve la key antes de tocar el ledger (lee `debtId`/`currencyCode` del pago
  existente y devuelve el status/remaining actual vía un nuevo helper de sólo lectura
  `getDebtRemainingStatus`, sin reescribir nada); rescate por `23505` si dos requests concurrentes
  chocan en el índice. `commandId` propagado: schema Zod → `recordPaymentAction` + diálogo de pago
  (`crypto.randomUUID()` regenerado en cada apertura). Tests:
  `tests/integration/debt-payment-idempotency.test.ts` (4, Postgres real, incluye la carrera
  concurrente — **prueba directamente el invariante anti-doble-conteo §14.1 bajo idempotencia**: dos
  intentos de la misma key sobre un pago parcial dejan el mismo `debtRemaining`, nunca lo duplican).
  Unit 795 ✓, lint ✓, 0 nuevos errores de tsc.

**WP-LEDGER-IDEMP completo (3/3 incrementos).** `transactions`, `transfers` y `debt_payments` son
idempotentes de punta a punta (DB → repo/service → schema → action → form). Bloqueante B-2 cerrado.

- **Goal:** ningún retry/doble-submit crea un movimiento, transferencia o pago de deuda duplicado (§38).
- **Dependencies:** WP-000.
- **Files likely affected:**
  - `packages/db/src/schema.ts` (+ migración nueva).
  - `apps/web/src/features/transactions/actions/{create-transaction,void-transaction}.ts`
  - `apps/web/src/features/transfers/actions/transfer-actions.ts` + `services/transfer-service.ts`
  - `apps/web/src/features/debts/actions/debt-actions.ts` + `services/*`
  - `apps/web/src/features/capture/actions/quick-actions.ts`
  - `packages/finance` (si se agrega un tipo de resultado "ya aplicado").
- **Database work:** `transactions.command_id uuid` nullable;
  `unique index transactions_user_command_unique on (user_id, command_id) where command_id is not null`.
  Revisar si `transfers` y `debt_payments` necesitan columna equivalente o reusan la de sus legs.
- **Backend work:** los services aceptan `idempotencyKey`; antes de escribir, `SELECT` por la key →
  si existe, devolver el recurso existente (no error); si no, escribir dentro de la misma transacción
  que inserta la key. Envolver en una sola transacción DB.
- **Frontend work:** cada formulario de mutación C-nivel genera un `idempotencyKey` (uuid) por intento
  de envío (no por render) y lo manda en el `FormData`. Deshabilitar botón en `pending`.
- **Tests:**
  - unit: service devuelve el mismo recurso ante misma key; recursos distintos ante keys distintas.
  - integration: dos llamadas concurrentes con misma key → una sola fila (Postgres, unique).
  - integration: timeout simulado + retry → sin duplicado.
- **Acceptance criteria:** `pnpm test:integration` cubre retry para transaction/transfer/debt-payment;
  `pnpm finance:audit` sin hallazgos nuevos.
- **Financial invariants:** §38 (idempotencia), §5.1 (no borrar hechos), atomicidad de transfer/pago.
- **Observability:** log estructurado con `commandId`, `requestId`, resultado (`created|deduped`).
- **DoD:** gate G3 (data integrity) desbloqueado para estos 3 comandos; specs 03/05/10 y doc 14 §38 sin TODO.

---

## WP-ANTI-DOUBLE-COUNT — Test end-to-end del invariante §14.1  ·  P0  ·  **DONE (2026-09-04)**

- **Goal:** demostrar que pagar una obligación no descuenta el dinero dos veces. ✅
- **Resultado:** `tests/integration/anti-double-count.test.ts` (4 tests) — corre contra el **wiring de
  producción real**: `createDashboardService` alimentado con `createAccountBalanceQueries` +
  `createDebtSummaryQueries` + `createUpcomingObligationQueries` reales (no mocks), y
  `createDebtPaymentService` real, contra Postgres real. Reproduce el escenario exacto de §14.1:
  1. **Antes:** saldo 1.000.000 − comprometido 300.000 = disponible 700.000.
  2. **Después de pago completo:** saldo 700.000 − comprometido 0 = disponible **700.000 (no 400.000)**.
  3. **Después de pago parcial (100.000):** saldo 900.000 − comprometido 200.000 = disponible 700.000.
  4. Un pago de deuda posta como `LIABILITY_PAYMENT`, nunca `EXPENSE` (§13, no re-consume presupuesto).
  No se necesitó ningún cambio de código de producción — el wiring ya era correcto; sólo el test que
  lo prueba faltaba. Detalle real detectado al escribir el test (no un bug de producto): hay que fijar
  el reloj (`now`) tanto del pago como del dashboard al mismo instante en la prueba, o el filtro `asOf`
  de `getAccountBalancesForUser` excluye el pago — los callers reales usan `Date.now()` en ambos lados.
- **DoD:** gate G1 avanzado; fila de `11-traceability-matrix.md` actualizada a evidencia real.

---

## WP-LEDGER-EXHAUSTIVE — Balance derivado a prueba de tipos nuevos  ·  P0  ·  **DONE (2026-09-04)**

- **Goal:** que un `transactionType` nuevo no pueda producir un balance silenciosamente incorrecto. ✅

### 🔴 Hallazgo CRITICAL confirmado y corregido en este WP

Al auditar la exhaustividad se encontró que **`TRANSFER_IN`/`TRANSFER_OUT` estaban ausentes de las
tres queries SQL que calculan el balance de cuenta** (`packages/db/src/queries/account-balances.ts`
×2 funciones, `packages/db/src/repositories/accounts.ts` `getBalanceInputsForUser`). Efecto real,
confirmado con un test que falló antes de la corrección: **transferir dinero entre dos cuentas
propias no cambiaba el saldo mostrado de ninguna de las dos** — ni en `/accounts`, ni en
`/accounts/:id`, ni en `/dashboard`. Viola Foundation §14 #5 ("derivar balances desde movimientos
confirmados") y spec 14 §4.5/PD-005 directamente.

- **Root cause:** tres funciones con `sum(case when type = 'INCOME' …)` escritas a mano, cada una
  copiada de la anterior y cada una repitiendo la misma omisión — exactamente el patrón que este WP
  buscaba prevenir.
- **Fix:** nuevo `packages/db/src/queries/ledger-totals.ts` — `buildLedgerTotalColumns()`, la única
  función que construye estas columnas SQL, respaldada por `TOTAL_KEY_BY_TYPE: Record<TransactionType,
  LedgerTotalKey>` (un `Record` sobre `transactionTypeEnum.enumValues` — si el enum crece sin agregar
  una entrada acá, **el archivo no compila**: esa es la guardia de exhaustividad, en tiempo de
  compilación, no en runtime). Las tres queries y sus dos consumidores
  (`features/accounts/services/account-service.ts`, `features/dashboard/services/dashboard-service.ts`)
  ahora pasan `transferInTotal`/`transferOutTotal` de punta a punta.
- **Tests:** `tests/unit/ledger-total-columns.test.ts` (cobertura 1:1 con el enum, sin duplicados);
  `tests/integration/transfer-balance.test.ts` (2, contra `createAccountService` real — el mismo
  path que usan `/accounts` y `/accounts/:id` — prueba que transferir mueve el saldo mostrado).
- **`LIABILITY_PAYMENT`** queda documentado como fuera del `LedgerTransactionType` puro de
  `packages/finance` (finding O-4, sin resolver en este WP — es un balance-only concern, no toca
  consumo/presupuesto, y ya está cubierto por `buildLedgerTotalColumns()`).
- **DoD ajustado:** no se agregó un validador a `finance:audit` — el balance nunca se persiste (no
  hay columna que auditar contra sí misma); la guardia real es de compilación (el `Record`
  exhaustivo) + los tests de arriba, que es donde este tipo de bug se puede prevenir de verdad.
- Verificación: unit 797/797 (+2), integration 19/19 nuevos, lint limpio, 0 errores nuevos de tsc.

**Este hallazgo se agrega a `02-financial-domain-audit.md` como L-3 (ahora RESUELTO) y sube la
severidad retroactiva de "HIGH especulativo" a "CRITICAL confirmado".**

---

## WP-MONEY-SCALE — Política de escala monetaria  ·  P1  ·  **DONE (2026-09-04)**

- **Goal:** eliminar el redondeo prematuro/por-paso que le impedía a `Money` preservar sub-centavo. ✅
- **Decisión del usuario:** la DB debe preservar sub-centavos — no sólo para splits, sino para
  representar pagos supuestos/estimados y agregados estadísticos completos. Ver
  `docs/adr/ADR-IMPL-002-money-settle-once-precision.md` (Accepted) para las 3 opciones evaluadas
  y por qué se descartaron las otras dos (persistir 6 decimales en TODO monto = alto
  riesgo/alcance, ~800 tests + toda pantalla de UI; tipo separado sólo para proyecciones = no
  arregla el ledger real).
- **Resultado — "settle-once":** `Money.amount` pasa a ser el valor exacto (decimal.js, sin
  redondear); el redondeo a los decimales de la moneda ocurre **una sola vez**, en `toString()`
  (persistencia/display) y en `split()` (que sigue asentando antes de dividir — una cuota de deuda
  es siempre un monto de centavos exactos). `add`/`subtract` ya no redondean en cada paso.
- **Files:** `packages/finance/src/money/money.ts` (único archivo tocado; `rounding.ts` sin cambios).
- **Tests:** `tests/unit/finance-money.test.ts` +3 — incluye la prueba directa del problema que
  resuelve: tres cargos de 0.004 USD (cada uno bajo el umbral de redondeo individual) suman 0.01
  al asentarse una sola vez al final, en vez de desaparecer a 0.00 con redondeo por paso.
- **Compatibilidad:** 0 regresiones — cada valor existente ya nace de un `.toString()` de 2
  decimales, así que redondear una vez al final da el mismo resultado que por paso. Confirmado:
  unit 800/800 (+3), integration 19/19, lint limpio, 0 tsc nuevos.
- **DoD:** ADR + tests; doc 02 M-4/D-6 cerrado (ver abajo).

---

## WP-EVENT-TAGS — Invalidación por evento  ·  P1  ·  **DONE (2026-09-04)**

- **Goal:** reemplazar `revalidatePath` hardcodeado por un mapa evento→invalidación único (§19). ✅
- **Alcance ajustado tras inspeccionar el código:** la app no usa `unstable_cache`/`revalidateTag`
  en ninguna página todavía (las Server Components leen fresco de los servicios en cada request) —
  sólo `revalidatePath` existía, para el Router Cache de Next. Construir tags por-usuario sobre una
  capa de cache que no existe habría sido infraestructura no usada (`crear abstracciones antes de
  demostrar su necesidad`, que este mismo roadmap prohíbe). Se implementó la versión real y
  necesaria: **un único mapa evento→paths**, sin `userId` (no hace falta — `revalidatePath` no es
  por-usuario en este esquema). Si en el futuro se adopta `unstable_cache` con tags, este es el
  único archivo que cambia.
- **Resultado:** `apps/web/src/lib/events/emit-financial-event.ts` — `PATHS_BY_EVENT` cubre los 17
  tipos de evento de doc 06/spec 14 §19 (`transaction.*`, `transfer.*`, `obligation.*`,
  `budget.updated`, `goal.updated`, `category.changed`, `personal_rule.changed`,
  `pending_item.resolved`, `import.completed`, `account.*`, `recurring.changed`,
  `subscription.changed`). `emitFinancialEvent({type, entityPaths?})` reemplazó **~85 llamadas a
  `revalidatePath` en 16 archivos de actions**.
- **Bug real corregido de paso:** `void-transaction.ts` nunca revalidaba `/budgets` — anular un
  gasto no actualizaba el consumo de presupuesto en pantalla hasta otra navegación. El mapa
  centralizado lo incluye para todo evento `transaction.*`, así que quedó corregido automáticamente
  al migrar esa action, no como un fix separado.
- **Tests:** `tests/unit/emit-financial-event.test.ts` (4) — `revalidate` inyectado como parámetro
  en vez de mockear `next/cache` (evita pelear con la resolución de módulos de Next en un test
  unitario; sigue el mismo patrón de dependencias inyectables que el resto del código).
- **Verificación:** unit 804/804 (+4), integration 19/19 sin regresión, lint limpio, 0 tsc nuevos.
- **DoD:** ninguna action lista paths a mano (confirmado por grep — sólo queda 1 `revalidatePath`
  directo, en "guardar como acción rápida" de Quick Add, que no es un evento de dominio financiero).

---

## Fase B (goal + criterio; desglose al iniciar)

| WP | Prio | Goal | Dep | Criterio |
|---|---|---|---|---|
| WP-ROUTES-SUBVIEWS | P1 `UX-RISK` | Subvistas de accounts/transactions/budgets/obligations/goals/insights como filtros server-side | ADR-001 | rutas de `04-route-registry` MISSING→OK; sin lógica de dominio nueva |
| WP-ACCOUNTS-SPEC | P1 `FINANCIAL-RISK` | Warning archivar saldo≠0 + exclusión de archivadas del balance líquido | WP-LEDGER-EXHAUSTIVE | test OQ-007 |
| WP-CAPTURE-CMDSURFACE | P1 | `features/capture` es command surface pura §25 | WP-LEDGER-IDEMP | no duplica ledger; valida IDs; enruta a owners |
| WP-IMPORTS-CF05 | P1 `FINANCIAL-RISK` | CF-05 completo y verificado | WP-LEDGER-IDEMP | preview sin escritura, batch idempotente, fingerprint, excepciones→Pendientes |
| WP-TRANSACTIONS-EDIT | P0 `FINANCIAL-RISK` | CM-02/03 recalculan todos los derivados | WP-EVENT-TAGS | tests por campo (monto/fecha/cuenta/categoría/tipo) |

## Fases C–H

Ver `09-implementation-roadmap.md`. Cada WP ahí listado se desglosa a este formato al comenzar su fase.
Ninguno arranca antes de que su dependencia esté `DONE` (regla `tasks/README.md`).

## Primer vertical slice recomendado

~~WP-000~~ (hecho) → **WP-IMPL-ADR-001 → WP-LEDGER-IDEMP → WP-ANTI-DOUBLE-COUNT.**
Justificación en el resumen de checkpoint (sección E).
