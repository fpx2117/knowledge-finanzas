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

## WP-ROUTES-RENAME — Ejecutar ADR-IMPL-001  ·  P1  ·  **DONE (2026-09-04)**

- **Goal:** el árbol `app/(app)/` y la navegación cumplen los paths canónicos de ADR-IMPL-001. ✅
- **Refinamiento sobre la ADR al implementar:** `/planning` (3 tabs: próximos/programados/reglas
  recurrentes) y `/transactions/recurrentes` (cola de sugerencias de detección) resultaron ser
  contenido genuinamente distinto — plegar el primero *dentro* del segundo habría mezclado dos
  conceptos de producto diferentes bajo una sola URL sin ningún trabajo de UX real detrás. En vez
  de forzar esa fusión, `/planning` pasó a **`/transactions/scheduled`** (ruta propia, sigue siendo
  de Transacciones — spec 14 §6 ya asigna `ScheduledTransaction`/`RecurringRule` al módulo 03) y
  `/transactions/recurrentes` se renombró mecánicamente a **`/transactions/recurring`** sin fusión.
  El fold de `/transactions/duplicados` en Pendientes sí se hizo completo (ver abajo) porque ahí
  las dos secciones son genuinamente parte de un mismo "qué necesita tu revisión".
- **Movidos** (vía `git mv`, preserva historia): `dashboard→app`, `debts→obligations` (+
  `[debtId]→[obligationId]`, `suscripciones→subscriptions`), `transfers→transactions/transfers`,
  `transactions/{pendientes→pending, recurrentes→recurring, importaciones→settings/imports}`,
  `settings/billing→settings/plan`, `goals/[goalId]/editar→edit`, `planning→transactions/scheduled`
  (con `planning/scheduled/new` colapsado a `transactions/scheduled/new`, evitando el segmento
  "scheduled" duplicado).
- **Fold real:** `/transactions/duplicados` se eliminó; su contenido (`DuplicateReviewList`) pasó a
  ser una segunda `SectionCard` dentro de `transactions/pending/page.tsx`, anclada en `#duplicados`
  — Pendientes es ahora el único hub de "movimientos que necesitan tu decisión" (sin categoría +
  posibles duplicados), consistente con cómo la spec 03 trata ambos como excepciones del mismo tipo.
- **`nav-items.ts`:** "Resumen"→`/app`; "Obligaciones" reemplaza "Deudas" (`/obligations` +
  hijos); Transacciones gana "Transferencias" y "Programados" como hijos (antes no estaban en el
  sidebar). `TransactionsSubnav` reconstruido con los 5 tabs canónicos (Movimientos/Pendientes/
  Duplicados-ancla/Programados/Recurrentes); Importaciones sale del tab bar (vive en Settings).
  `settings/imports/page.tsx` dejó de renderizar `TransactionsSubnav` (ya no es una pestaña de
  Transacciones).
- **Redirects 308:** `apps/web/next.config.ts` `redirects()` — 15 reglas cubriendo cada path viejo
  (incl. dinámicos vía `:param`), con las más específicas (`/planning/scheduled/new`) antes que las
  generales (`/planning`).
- **Corregido de paso:** el barrido de string-replace mecánico rompió por un momento
  `@/features/dashboard/...`, `@/features/debts/...` y `@/features/transfers/...` (imports de
  módulo cuyo nombre coincide por sustring con un path de ruta renombrado) — detectado por
  `pnpm typecheck` (nuevos "Cannot find module") y revertido sólo en esas líneas de import; los
  módulos de dominio (`features/debts`, `features/transfers`, `features/dashboard`, `features/planning`)
  **no** se renombraron, sólo las rutas.
- **Tests:** actualizados 11 specs de `tests/e2e/*` (URLs literales) + `tests/e2e/support/onboarding-flow.ts`;
  `tests/unit/emit-financial-event.test.ts` actualizado a los nuevos paths del mapa de eventos.
  No se agregó un test de redirect 308 dedicado (E2E no corre en este entorno sin servidor+DB
  levantados) — queda como seguimiento antes de desplegar.
- **Verificación:** `pnpm typecheck` estable en 148 errores preexistentes (mismos, sólo re-etiquetados
  bajo los nuevos paths de archivo — confirmado por diff antes/después); lint limpio; unit 804/804;
  los 19 tests de integración de Fase A sin regresión (no tocan rutas, pero confirman que el dominio
  sigue intacto). `pnpm test:e2e` no se ejecutó (requiere Postgres de test + build; ver limitación
  de entorno).
- **Acceptance criteria:** `04-route-registry.md` sin filas `RENAME` por naming (actualizar en la
  próxima pasada de discovery); árbol de rutas confirmado 1:1 contra la tabla "canónico decidido".
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
| ~~WP-ROUTES-SUBVIEWS~~ **DONE (2026-09-04, parcial — Cuentas/Presupuestos/Obligaciones/Metas)** | P1 `UX-RISK` | Ver detalle abajo | ADR-001, WP-ROUTES-RENAME | rutas de Cuentas/Presupuestos/Obligaciones/Metas en `04-route-registry` MISSING→OK. Transacciones ya cubierto por WP-ROUTES-RENAME. Insights queda pendiente (depende de WP-INSIGHT-DETECTORS, Fase F — no tiene sentido crear `/insights/{opportunities,history}` sin detectores reales detrás). |

### Detalle de lo hecho

- **Cuentas** — `/accounts/{banks,wallets,cash,savings}`: nuevo `features/accounts/views/accounts-view.tsx`
  (extraído de `page.tsx`, parametrizado por `type`) reusado por las 4 subvistas + la vista "Todas";
  `AccountsExplorer` gana `defaultType`. Stats/donut se recalculan sobre el subconjunto filtrado
  (p.ej. "Bancos" muestra el saldo total sólo de cuentas bancarias).
- **Presupuestos** — `/budgets/categories` (tabla completa sin las stat cards del resumen);
  `/budgets/history` (`?month=YYYY-MM`, últimos 6 meses) — requirió extender
  `createBudgetService`: `computeOverviewItems` ahora acepta un `period` opcional y se agregó
  `getBudgetOverviewForMonth(user, year, month)`. Los presupuestos son un límite estándar por
  categoría, no una fila por mes, así que "Historial" **recalcula el consumo real contra meses
  pasados** vía `getCategorySpendingForUser`, nunca lee una foto guardada.
- **Obligaciones** — `/obligations/upcoming` redirige a `/obligations?tab=proximos` (el contenido
  ya existía como tab de query-param; puentea sin duplicar el render). `/obligations/installments`
  es nuevo: lista las deudas `type = PURCHASE_INSTALLMENTS` (compras en cuotas), separadas de
  préstamos personales/deudas con terceros/servicios que quedan en la vista general.
- **Metas** — `/goals/active`, `/goals/completed`: `GoalRow` se extrajo de `goals/page.tsx` a
  `features/goals/components/goal-row.tsx` para reusarlo en las 3 vistas sin duplicar markup.
- **`nav-items.ts`**: Cuentas, Presupuestos, Obligaciones y Metas ganaron `children` (antes eran
  links planos) — sidebar ahora coincide con el mapa de navegación de spec 14 §7 para estos 4 módulos.
- **Verificación:** lint limpio, `pnpm typecheck` estable en los mismos 148 errores preexistentes
  (0 nuevos), unit 804/804 sin cambio (páginas de servidor sin lógica de dominio nueva que testear
  aisladamente — la cobertura real es E2E, no ejecutado en este entorno).
| ~~WP-ACCOUNTS-SPEC~~ **DONE (2026-09-04)** | P1 `FINANCIAL-RISK` | Ver detalle abajo | WP-LEDGER-EXHAUSTIVE | 3 integration (OQ-007) |

### Detalle

- **Warning al archivar con saldo ≠ 0:** `account-actions.tsx` ahora recibe `balance`/`currencyCode`
  y muestra una advertencia específica en el diálogo de confirmación cuando el saldo no es cero
  ("al archivarla, ese saldo deja de sumar... el movimiento no se borra"). La decisión de producto
  (OQ-007) es **permitir** archivar igual, no bloquear — el archivo no destruye ni mueve dinero.
- **Exclusión de archivadas del balance activo:** ya estaba correctamente implementado
  (`getAccountBalancesForUser`/`listAccounts` filtran `status = 'ACTIVE'` salvo `includeArchived:
  true` explícito) — este WP lo **confirmó con test**, no lo corrigió.
- **Tests:** `tests/integration/account-archive.test.ts` (3, Postgres real) — archivar con saldo
  no bloquea; el saldo desaparece de `listAccounts()` (activos) pero sigue accesible con
  `includeArchived: true` (historial preservado, no oculto ni puesto en cero); archivar dos veces
  es no-op, no error.
- **Verificación:** unit 813/813 sin cambio, integration +3, lint limpio, typecheck 148/148.
| ~~WP-CAPTURE-CMDSURFACE~~ **DONE (2026-09-04, auditoría con 1 gap real corregido)** | P1 | Ver detalle abajo | WP-LEDGER-IDEMP | confirmado por lectura de código |

### Detalle de la auditoría

`features/capture` resultó **mayormente compliant** con §25 ya antes de tocar nada:

- **No duplica ledger:** `quick-actions.ts` delega toda escritura a
  `createTransactionService()` de `features/transactions` (el mismo módulo que usa el form
  dedicado) — ninguna lógica de balance/clasificación reimplementada en capture.
- **Enruta a owners, no posee entidades:** cuando el usuario elige Transferencia u Obligación en
  Registrar, el diálogo **no intenta crear nada** — redirige a `/transactions/transfers/new` u
  `/obligations/new` (dueños reales). Confirmado en `quick-add.tsx`.
- **IA nunca escribe ni decide sola:** `capture-parser-service.ts` sólo produce un *draft* de
  texto (tipo/monto/descripción/comercio/institución/confianza) — nunca un ID. El parser
  determinístico corre primero; la IA es fallback de baja confianza únicamente, **nunca se le
  pide ni se acepta un draft de tipo `TRANSFER`** (bloqueado explícitamente dos veces: antes de
  invocarla y validando su respuesta), y cualquier falla de IA cae de vuelta al draft
  determinístico sin bloquear la captura (§13/§29 — el núcleo sigue andando sin IA).
- **Valida IDs contra recursos reales:** la creación final siempre pasa por
  `transaction-service.create()`, que valida `accountId`/`categoryId` contra la DB del usuario —
  capture nunca inventa ni confía en un ID sin validar.
- **Duplicados en creación (CF-02.5/§20):** Quick Add ya bloqueaba duplicados probables antes de
  crear (`findLikelyExpenseDuplicate`/`findLikelyIncomeDuplicate` + confirmación "Registrar igual").

**Gap real encontrado y corregido:** el form dedicado (`/transactions/new`,
`create-transaction.ts`) **no tenía este guard** — un usuario podía crear un duplicado sin
advertencia ahí, mientras que por Quick Add sí se le avisaba. Se agregó el mismo guard
(`allowDuplicate` + aviso "Puede que ya lo tengas registrado" + botón "Registrar igual") a
`create-transaction.ts` + `transaction-form.tsx`, reusando los métodos de servicio ya existentes
y ya testeados (`findLikelyExpenseDuplicate`/`findLikelyIncomeDuplicate`, cubiertos en
`transactions-service.test.ts` §20).
- **Verificación:** lint limpio, typecheck 148/148 (0 nuevos), unit 813/813 sin cambio (la lógica
  de servicio que se reusa ya estaba testeada; el fix es glue de action/UI, sin patrón de test de
  actions en este repo).
| ~~WP-IMPORTS-CF05~~ **DONE (alcance acotado, 2026-09-04) — último WP de Fase B** | P1 `FINANCIAL-RISK` | Ver detalle abajo | WP-LEDGER-IDEMP | migración + 3 unit + 4 integration |

### Detalle de la auditoría

Confirmado ya compliant: preview sin escritura (`buildImportPreview` es pura), detección de
columnas/delimitador (`detectColumns`/`parseDelimited`), validación de cuenta (existe, no
archivada), dedup por fingerprint (`duplicateScore` contra existentes Y contra otras filas del
mismo archivo), reconciliación de contadores en el resultado.

**Gap real encontrado y corregido — idempotencia del batch (§38):** `commitImport` no tenía key
propia; dependía sólo del fingerprint (heurístico) para no reimportar en un reintento. Peor:
**un test de carrera contra Postgres real demostró que dos commits concurrentes del mismo archivo
creaban el doble de transacciones** (4 en vez de 2) — el fingerprint no protege contra dos
requests procesando filas en paralelo antes de que ninguna haya persistido nada. Fix real, no
cosmético:
- `import_batches.command_id` + índice único parcial (migración `0042`).
- Patrón "reclamar antes de procesar": nuevo `claim()` en el repo inserta un placeholder de
  contadores en cero **antes** de tocar cualquier fila; si otro commit concurrente ya lo reclamó,
  éste se retira sin crear nada (`claimed: false`). Al terminar, `updateCounts()` completa los
  contadores reales. Esto es lo que de verdad serializa la carrera — el chequeo simple de
  "¿ya existe un batch con esta key?" al principio sólo cubre el caso secuencial (reintento
  después de que el primero terminó), no el concurrente.
- `commandId` propagado: schema → repo (`claim`/`updateCounts`/`findByCommandId`) → servicio →
  action → `import-wizard.tsx` (uuid por intento de commit).

**Gap NO corregido (decisión del usuario):** las filas ilegibles siguen sin enviarse a
Transacciones > Pendientes — sólo se cuentan (`unreadable`). Documentado como deuda pendiente,
no como bug — requeriría una tabla nueva + UI, es una feature aparte, no un fix de este WP.

**Tests:** `tests/unit/import-service.test.ts` (+4: replay sin duplicar, key propagada, key nula
no dedup, retiro cuando otro ya reclamó) + `tests/integration/import-idempotency.test.ts` (3,
Postgres real — **incluye la prueba de la carrera concurrente real que expuso el bug**).
Verificación: unit 817/817 (+4), integration 29/29 (+3 nuevos, resto sin regresión), lint limpio,
typecheck 148/148 (0 nuevos).

**Fase B completa: 5/5 work packages.**
| ~~WP-TRANSACTIONS-EDIT~~ **DONE (alcance acotado, 2026-09-04)** | P0 `FINANCIAL-RISK` | Ver detalle abajo | WP-EVENT-TAGS | 9 unit + 4 integration |

### Detalle — alcance acotado (decisión del usuario)

Al abrir este WP encontramos que **no existía ninguna función de editar transacción** — sólo
anular, "registrar de nuevo" (crea una transacción nueva) y corregir categoría desde Pendientes.
El repositorio tenía `updateMetadataForUser` sin usar, y sin soporte para monto/fecha/cuenta/tipo.
Construir la edición completa (CM-02: monto/fecha/cuenta/categoría/tipo con recalculo de balance
en una o dos cuentas + presupuesto en mes viejo y nuevo) es una feature nueva del tamaño de otro
WP-LEDGER-IDEMP, no un test. El usuario eligió **edición acotada**:

- **Editable:** descripción, comercio, categoría, notas.
- **No editable acá:** monto, fecha, cuenta, tipo — para corregir esos campos se anula y se
  registra de nuevo (ya soportado), preservando el trail de auditoría exacto en vez de mutar un
  hecho confirmado.
- **Implementación:** `packages/db/src/repositories/transactions.ts` `updateMetadataForUser`
  extendido (acepta `taxonomyNodeId`/`categoryChanged`, misma marca de proveniencia
  `user_explicit` que `setCategoryForUser`); `transaction-service.ts` gana `editTransaction`
  (valida ownership, status POSTED, tipo INCOME/EXPENSE, categoría activa y del tipo correcto,
  resuelve `taxonomyNodeId` vía `categoryMap` si la categoría cambió); nueva action
  `edit-transaction.ts` + schema `editTransactionSchema`; UI: diálogo "Editar" en
  `TransactionActions` con descripción/comercio/categoría/notas — el texto del diálogo aclara
  explícitamente por qué monto/fecha/cuenta/tipo no están ahí.
- **Tests:** 9 unit (`transactions-service.test.ts` — incluye rechazo de VOIDED, de tipos no
  INCOME/EXPENSE, de categoría archivada/de tipo incorrecto, limpieza de categoría) + 4 integration
  (`transaction-edit.test.ts`, Postgres real — incluye **IDOR**: un usuario no puede editar la
  transacción de otro).
- **Verificación:** unit 813/813 (+9), integration 23/23 (+4), lint limpio, typecheck 148/148
  (0 nuevos).

## WP-READMODEL-CONTRACT — Contrato de read model de Reportes  ·  P0  ·  **DONE (2026-09-04)**

- **Goal:** que el output de `createReportService().getReport()` lleve un contrato explícito
  (versión de cálculo + cobertura de monedas), en vez de que cada vista de Reportes reinvente su
  propia noción de "esto es confiable" (§21/§42).
- **Resultado:** `ReportData` gana `calculationVersion: 1` (bump manual si la lógica de agregación
  cambia — no es cache key, es un sello de forma) y `coverage: { excludedCurrencies: string[] }`
  (cuentas cuya moneda ≠ `baseCurrency`, excluidas de todos los totales por §22 — nunca mezcladas).
  `netWorthDetail` también se agrega acá (activos líquidos / deuda pendiente / patrimonio neto en
  moneda base) porque comparte el mismo cálculo que alimenta `kpis.netWorth`.
- **Implementación:** `apps/web/src/features/reports/services/report-service.ts` — `excludedCurrencies`
  se deriva de `liquidRows` filtrando `currencyCode !== baseCurrency`; se retiró el `ReportTab`
  union type (ya sin consumidores tras el split de rutas de WP-REPORTS-P0).
- **Verificación:** lint limpio, typecheck 148/148 (0 nuevos), unit 817/817 (sin regresión).

## WP-REPORTS-P0 — Vistas P0 de Reportes con drill-down  ·  P0  ·  **DONE (2026-09-04)**

- **Goal:** Reportes deja de ser una sola página con `?tab=` y stubs "NotReady"; cada vista P0 tiene
  su propia ruta canónica con drill-down verificable al ledger.
- **Resultado:** rutas nuevas `apps/web/src/app/(app)/reports/{expenses,income,cash-flow,categories}/page.tsx`
  (P0) + `net-worth/page.tsx` (P1, ver WP-REPORTS-NETWORTH — se implementó en el mismo pase por
  compartir `netWorthDetail`). `/reports/page.tsx` (Panorama) reescrito para no depender de `?tab=`.
- **Shared:** `apps/web/src/features/reports/components/report-shared.tsx` (nuevo) —
  `BreakdownTable` ahora linkea cada fila de categoría a `/transactions?period=X&category=Y`
  (drill-down real, no decorativo); `ReportsNav` (6 tabs, preserva `?period=`);
  `ExcludedCurrenciesNote`; helpers de formato compartidos entre vistas.
- **Drill-down habilitado en destino:** `apps/web/src/app/(app)/transactions/page.tsx` gana
  `?category=` — filtra `transactionRepository.listForUser`, muestra chip "Filtrado por categoría: X"
  con link "Quitar filtro", y `buildHref()` preserva el param en paginación.
- **Cash-flow:** `/reports/cash-flow` reutiliza los 6 meses históricos ya calculados (`months`) —
  deliberadamente distinto del cashflow *proyectado* del Dashboard (comentario en el archivo cita
  §16: Reportes describe lo confirmado, Dashboard proyecta).
- **Nav:** `nav-items.ts` — "Reportes" pasa de link plano a `children` (Panorama/Gastos/Ingresos/
  Flujo de caja/Patrimonio/Categorías), spec 14 §7.
- **Verificación:** lint limpio (1 warning de import sin uso corregido en `net-worth/page.tsx`),
  typecheck 148/148 (0 nuevos), unit 817/817.

## WP-REPORTS-NETWORTH — `/reports/net-worth`  ·  P1  ·  **DONE (2026-09-04)**

- **Goal:** vista de patrimonio neto (activos líquidos − deuda pendiente), moneda base únicamente.
- **Resultado:** `apps/web/src/app/(app)/reports/net-worth/page.tsx` — 3 `StatCard` (activos
  líquidos, deuda pendiente, patrimonio neto) desde `report.netWorthDetail`; `ExcludedCurrenciesNote`
  visible; links de detalle a `/accounts` y `/obligations`. Implementado junto con WP-REPORTS-P0
  (ver arriba) por compartir el mismo cálculo de `report-service.ts`.
- **Verificación:** incluida en la corrida conjunta de WP-REPORTS-P0.

## WP-DASHBOARD-SPEC01 — Reconciliar `/app` con spec 01  ·  P0  ·  **DONE (alcance acotado, 2026-09-04)**

- **Goal:** el dashboard deja de mostrar términos/semántica que la spec no define y deja de elegir
  arbitrariamente una moneda para sus KPIs.
- **Alcance tomado (usuario eligió "los 3 P0 juntos" ante el tamaño del WP completo):**
  1. **KPIs correctos (§8-10):** KPI-1 pasa de "Patrimonio neto" (balance − deuda, un término que
     la spec no usa en Resumen — vive en `/reports/net-worth`) a **"Saldo total"** (balance
     confirmado, sin restar deuda, §8.2). Se agrega el KPI-3 **"Resultado del período"** (ingresos
     − gastos confirmados, §10) que no existía como tarjeta. Fila de KPIs baja de 4 a exactamente
     **3** (§6.2 regla de densidad: "no mostrar más de 3 KPI primarios"). "Obligaciones pendientes"
     y "Próximo vencimiento" (antes KPIs sueltos) se replegaron dentro de la card "Obligaciones
     próximas" (eyebrow con el total a 30 días + lista, sin pérdida de información) y su acción
     pasa a `/obligations` (antes `/calendar`), conforme a la tabla de navegación contextual §5.3.
  2. **Multimoneda separada (§8.3/RF-03/D-09):** `currency` ya no es `liquidBalances[0]` arbitrario
     — se prioriza `baseCurrency` del usuario si tiene cuentas en esa moneda. Cualquier otra moneda
     con saldo ≠ 0 se muestra explícitamente en una nota aparte ("También tenés saldo en USD 1.250
     — no se suma al saldo de arriba") en vez de desaparecer silenciosamente de los KPIs.
  3. **Drawer de explicación de disponible (§9.4):** nuevo `AvailableMoneyDialog`
     (`features/dashboard/components/available-money-dialog.tsx`, client component) reemplaza el
     tooltip estático — desglosa saldo confirmado / obligaciones comprometidas / disponible, declara
     la ventana de cobertura (§9.5, "Después de compromisos... hasta el {fecha}") y cada obligación
     es expandible mostrando su vencimiento (§9.4 "cada obligación puede expandirse"). Los datos ya
     existían en `calculateSpendable()` (`liquidBalance`/`committedObligations`/`commitments`/
     `horizonEnd`) — sin cambios al dominio financiero, sólo se surface en la UI.
  - `StatCard.hint` amplía su tipo de `string` a `React.ReactNode` (cambio compatible — todos los
    usos existentes pasan strings) para poder alojar el trigger del drawer y los montos compuestos.
- **Explícitamente fuera de este incremento** (documentado, no resuelto silenciosamente): estados
  de calidad de datos (§17 — sin categorizar/duplicados/cuenta sin actividad), degradación parcial
  por sección con mensajes específicos por fallo (§18.2/§18.3 — hoy sólo hay un `error.tsx` global),
  empty state "tiene cuenta, sin movimientos" (§19.2), texto equivalente accesible del gráfico de
  flujo (§24.3). Quedan para un WP de seguimiento si el usuario lo prioriza.
- **Verificación:** lint limpio, typecheck 148/148 (0 nuevos), unit 817/817 (sin regresión;
  ningún test cubre directamente el dashboard — no hay tests de componente en el repo, ver
  convención de testing del proyecto).

## WP-OBLIGATION-READMODEL — Read model unificado de Obligaciones  ·  P1  ·  **DONE (2026-09-05)**

- **Goal:** una sola función determinística que las vistas de Obligaciones y la capa "obligaciones"
  del Calendario consuman por igual, en vez de que cada superficie reinvente cómo junta deuda +
  suscripción + programado (hoy `/obligations` sólo maneja deudas, las suscripciones viven aparte,
  el calendario mezcla todo sin taxonomía).
- **Arquitectura:** lógica pura en `@know-finanzas/finance` (`projections/obligations.ts`):
  - Taxonomía spec 05 §6: `ObligationType` / `ObligationAmountMode` (FIXED·VARIABLE·ESTIMATED·
    CONFIRMED) / `ObligationConfidence` (COMMITTED·EXPECTED) / `ObligationSource` / `ObligationStatus`
    (UPCOMING·DUE_SOON·DUE_TODAY·OVERDUE·PARTIALLY_PAID — los tres del medio derivados de la fecha,
    no persistidos, §6.4).
  - `deriveObligationStatus()` — status de presentación desde fecha + pagos.
  - `buildObligationReadModel()` — filtra a `[today − graceDays, today + horizonDays]`, resta
    pagos, descarta lo ya saldado, dedupe por `${sourceType}:${sourceId}`, ordena por fecha.
  - `summariseObligationsByCurrency()` — **nunca** suma FIXED/CONFIRMED con ESTIMATED/VARIABLE en un
    solo número (§10.3: "comprometido confirmado" vs "estimado"); **nunca** suma monedas (§22 —
    totales per-moneda, `baseCurrency` primero, resto en `excludedCurrencies`).
  - `rollForwardRecurringDate()` — adelanta un `nextExpectedOn` de suscripción vencido a la próxima
    ocurrencia ≥ hoy (maneja fin de mes: 31-ene +1mes → 28/29-feb), para no mostrar un cargo
    "vencido" fantasma de hace meses.
- **Wiring (app):** `apps/web/src/features/obligations/services/obligation-read-model.ts` —
  `createObligationReadModel(db).getObligations({ userId, timezone, baseCurrency, horizonDays=30,
  overdueGraceDays=90 })`. Tres fuentes: cuotas de deuda (`listDebtInstallmentsForUser`, FIXED/
  COMMITTED, paidAmount = allocaciones POSTED), programados EXPENSE (`listScheduledForUser`, FIXED/
  EXPECTED — los INCOME futuros se ignoran, §9.3), suscripciones ACTIVE (`subscriptionRepository`,
  ESTIMATED/EXPECTED/DETECTED). Anti-doble-conteo: las queries ya excluyen cuotas PAID/CANCELLED y
  programados no-SCHEDULED, así que un pago ya aplicado no puede volver a contar.
- **Fuera de alcance (follow-up documentado):** expandir reglas `recurring_transactions` que todavía
  no tienen fila `scheduled_transactions` materializada — requiere proyección RRULE y se dejó fuera
  a propósito para mantener el read model determinístico. Ninguna de las vistas actuales lo hace.
- **Tests:** 6 unit (`tests/unit/finance-obligations.test.ts` — status derivado, no mezclar
  confirmado/estimado, monedas separadas, resta de pagos + dedupe + descartar saldado, ventana de
  horizonte + gracia, roll-forward incl. fin de mes) + 2 integration (`obligation-read-model.test.ts`,
  Postgres real — unifica las 3 fuentes con el wiring de producción, ignora el programado INCOME,
  respeta el horizonte).
- **Verificación:** lint (web) limpio, typecheck 148/148 (0 nuevos), unit 823/823 (+6), integration
  del WP 2/2.

## WP-OBLIGATIONS-UI — Vistas de Obligaciones sobre el read model  ·  P1  ·  **CASI DONE (2026-09-05)**

- **Goal:** que las vistas de Obligaciones dejen de mirar sólo `debts` y consuman el read model
  unificado de [[WP-OBLIGATION-READMODEL]].
- **Hecho — `/obligations/upcoming` ("Próximas", spec 05 §10):** dejó de ser un `redirect` a
  `/obligations?tab=proximos` (que sólo mostraba cuotas de deuda) y es una vista real sobre
  `createObligationReadModel().getObligations()`:
  - Selector de horizonte 7/15/30/60/90 días, default 30 (§10.2) — `?horizon=`, componente
    `HorizonSelector` en `features/obligations/components/obligations-shared.tsx`.
  - Resumen: "Comprometido confirmado" y "Estimado" en tarjetas separadas — nunca en el mismo
    número (§10.3); la de estimado dice cuántas obligaciones tienen monto aproximado.
  - Línea temporal (§10.4): "Hoy · saldo X" → lista de obligaciones con chip de estado semántico
    (`OBLIGATION_STATUS_META`) y tipo (`OBLIGATION_TYPE_LABEL`), prefijo "≈" en los estimados →
    "Saldo proyectado tras compromisos conocidos" (líquido − confirmado). Si hay estimados, muestra
    "Proyección parcial: N obligaciones tienen un monto por confirmar" + el peor caso.
  - Riesgo de saldo insuficiente (§10.5): callout de advertencia (no sólo color, no alarmista)
    cuando el saldo proyectado queda negativo.
  - Multimoneda: proyección de saldo sólo en la moneda base; nota aparte para obligaciones en otra
    moneda (no se suman).
  - Saldo líquido vía `createAccountBalanceQueries(db).getLiquidTotalsForUser()` (query per-moneda
    ya existente).
- **Hecho — vista principal `/obligations` "Todas" (spec 05 §9):** reconstruida sobre el read model
  con horizonte 365 días (cubre "Este mes" y "Más adelante"):
  - §9.3: 4 KPIs — "Próximos 30 días" (confirmado), "Vencen esta semana" (DUE_TODAY+DUE_SOON),
    "Atrasado" (vencido sin pagar), "Obligaciones activas" (conteo). Totales sólo en moneda base +
    nota para el resto (§9.3 multimoneda).
  - §9.4: sección "Necesita atención" — vencidas + pago parcial + estimadas que vencen en ≤3 días.
    Sólo se renderiza si hay algo.
  - §9.5/§9.6: lista agrupada por *tiempo* (Vencidas / Hoy / Próximos 7 días / Este mes / Más
    adelante — `groupObligationsTemporally` en `obligations-shared.tsx`), no por tipo; cada fila con
    nombre, tipo, fecha, monto (prefijo "≈" si estimado) y chip de estado semántico.
  - Pestañas: "Todas" (read model) · "Deudas" (registro de deudas, antes "Todas") · "Pagadas".
    Se quitó el tab `proximos` (duplicaba `/obligations/upcoming`); "Ver todos" → esa ruta.
- **Falta sólo:** detalle unificado — `/obligations/[obligationId]` sigue siendo sólo de deudas;
  una suscripción o un programado no tiene página de detalle propia (sus filas linkean a
  `/obligations/subscriptions` / `/transactions/scheduled`).
- **Verificación:** lint (web) limpio, typecheck 148/148 (0 nuevos), unit 825/825 (+2:
  `tests/unit/obligations-grouping.test.ts`). Las vistas no tienen tests de componente (convención
  del repo); la lógica está cubierta por `finance-obligations` + `obligation-read-model` +
  `obligations-grouping`.

## WP-CALENDAR-LAYERS — Taxonomía temporal-financiera del Calendario  ·  P1  ·  **PARCIAL (2026-09-05)**

- **Goal (spec 06 §0.1):** que TODO evento del calendario indique inequívocamente si es
  confirmado / comprometido / programado / estimado / vencido / pagado — hoy sólo había un
  `projected: boolean`.
- **Hecho:**
  - `calendar-service.ts`: nuevo `CalendarLayer` (`CONFIRMED`·`COMMITTED`·`SCHEDULED`·`ESTIMATED`·
    `OVERDUE`·`PAID`, §5). Clasificación: transacción POSTED / transferencia → `CONFIRMED`; cuota de
    deuda → `OVERDUE` si `dueDate < today` si no `COMMITTED` (derivado, no persistido); programado →
    `SCHEDULED`. `projected` pasa a ser derivado (`!CONFIRMED && !PAID`). `ESTIMATED` queda en el
    tipo para cuando el calendario consuma suscripciones (follow-up).
  - `summary.layers` — desglose por capa en moneda base: `confirmedNet` / `committed` / `scheduled`
    (neto) / `overdue`, más `excludedCurrencies` (§10 — nunca se suman monedas).
  - `calendar-grid.tsx`: `LAYER_META` con **glyph + palabra** (`✓` Confirmado, `•` Comprometido,
    `↻` Programado, `~` Estimado, `!` Vencido) — estado detectable sin color (§6.4). Glyph en el
    chip de la grilla y en la fila; leyenda en la página.
  - `calendar/page.tsx`: reemplazó el `InsightCard` "Balance proyectado" por una card "Por estado
    temporal" con el desglose de capas + aclaración "es una proyección, no un saldo real" +
    leyenda de glyphs + nota de monedas excluidas.
- **Tests:** +3 unit DST (`finance-dates.test.ts` — spring-forward buckets al día local correcto,
  fall-back con hora repetida al mismo día, rangos de mes/día anclados a medianoche local cuando el
  offset UTC cambia a mitad de rango) + 3 integration (`calendar-layers.test.ts`, Postgres real —
  clasificación por capa, monedas separadas en el resumen, bucketing por timezone en el boundary de
  mes cerca del DST).
- **Falta (follow-up UI, no correctitud):** modos Agenda (§7) y Día (§8, drawer + "Ver cálculo").
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 828/828 (+3), integration
  del WP 3/3.

## WP-BUDGET-CONSUMPTION — Consumo de presupuesto correcto  ·  P1 · FINANCIAL  ·  **DONE (2026-09-05)**

- **Goal (spec 04 §13/§18/§21):** que "Gastado" en un presupuesto sea consumo neto real —
  `EXPENSE − REFUND` — y excluya transferencias, pagos de deuda/tarjeta, ajustes contables,
  ingresos y anulados, sin doble contar.
- **Hallazgo:** la query `getCategorySpendingForUser` (`packages/db/src/queries/budgets.ts`) y
  `budget-service.ts` **ya eran correctos**. `netExpense = Σ(EXPENSE) − Σ(REFUND)` es exactamente
  `Σ classifyLedgerEffect().consumptionDelta` sobre las filas seleccionadas; el filtro
  `type in ('EXPENSE','REFUND')` excluye estructuralmente `TRANSFER_IN/OUT` (§19), `LIABILITY_PAYMENT`
  (§21 — liquidación, no consumo nuevo), `ADJUSTMENT_IN/OUT` (§18.2) e `INCOME`; `status='POSTED'`
  excluye VOIDED (el enum no tiene PENDING); el refund reduce el período en que se registra (§20.3
  P0); `resolveCategorySubtreeIds` hace el rollup por subárbol. `netExpense` negativo (refunds >
  gastos) está bien y `calculateBudget` lo maneja (NORMAL, remaining sobre el límite).
- **Trabajo hecho:** comentario en la query que ata la fórmula a §13/§18/§21 + `tests/integration/
  budget-consumption.test.ts` (Postgres real, wiring de producción): (1) cuenta EXPENSE − REFUND con
  rollup de subcategoría e ignora transferencia real / `LIABILITY_PAYMENT` / `ADJUSTMENT_OUT` /
  VOIDED / fila fuera del período; (2) un refund grande empuja el neto bajo cero sin romper el
  presupuesto.
- **Ya existían:** `/budgets/[budgetId]` (detalle con transacciones que explican el consumo) y
  `/budgets/history` (recálculo real del consumo contra cada mes pasado, no una foto).
- **Nota / no en alcance:** §18.1 menciona incluir "ajustes que explícitamente representen consumo
  corregido" — no hay sub-tipo de ADJUSTMENT que distinga eso de un ajuste puramente contable, así
  que se excluyen todos (conservador, alineado con §18.2). Documentado, no inventado.
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 828/828, integration del WP 2/2.

## WP-GOALS-ALLOC — Progreso de meta derivado de asignaciones  ·  P1 · FINANCIAL  ·  **DONE (2026-09-05)**

- **Blocker del checkpoint original:** `goals.current_amount` era una columna mutable que cualquier
  caller podía setear — no derivada de asignaciones explícitas (spec 07 §6.2, §15).
- **Diseño (elegido por el usuario): cache mantenido transaccionalmente + audit check.**
  `goal_allocations` es la verdad; `goals.current_amount` queda como cache, re-sincronizado dentro
  de la MISMA transacción que cada escritura de allocation, y un check de `finance:audit` garantiza
  que jamás diverjan. No toca los read paths de metas (siguen leyendo el cache).
- **Schema (`0043_powerful_surge.sql`):** `goal_allocation_kind` enum (INITIAL·CONTRIBUTION·
  WITHDRAWAL) + tabla `goal_allocations` (`amount > 0`, `currencyCode`, `occurredOn`, `note`,
  `accountId?` §15.2, `relatedTransactionId?` §16.1 — evidencia opcional, la semántica no depende de
  ella). Backfill: una allocation `INITIAL` por cada meta con `current_amount > 0`.
- **Derivación:** `currentAmount = Σ(INITIAL+CONTRIBUTION).amount − Σ WITHDRAWAL.amount`
  (`createGoalAllocationRepository.derivedCurrentAmount`).
- **Servicio (`goal-service.ts`):** `applyAllocation()` hace `insert allocation → recompute →
  syncDerivedProgressForUser` en `database.transaction`. `createGoal` con monto inicial → allocation
  INITIAL (la meta nace con `current_amount = 0`). `contribute()` → CONTRIBUTION. Nuevo `withdraw()`
  → WITHDRAWAL (rechaza si dejaría el progreso < 0 con `GOAL_WITHDRAWAL_EXCEEDS_PROGRESS`; puede
  re-abrir una meta COMPLETED a ACTIVE). Nuevo `listAllocations()` para el historial (§14).
- **CM-08 (aporte ≠ gasto):** un aporte/retiro no toca `transactions` en absoluto — probado con un
  assert de que no se crea ninguna fila de ledger.
- **Audit (`checkGoalAllocationConsistency`):** cache vs Σ allocations; moneda de allocation vs meta;
  ownership de allocation vs meta. Cableado en `runFinanceAudit` + `scannedCounts.goalAllocations`.
- **UI:** diálogo "Retirar" nuevo en `GoalActions` (con copy que aclara que no mueve dinero ni
  registra un gasto) + campo "Nota" en aporte/retiro. `withdrawGoalAction` + `withdrawGoalSchema`.
- **Tests:** `tests/integration/goal-allocations.test.ts` (4, Postgres real) — derivación + CM-08 +
  audit limpio; completar/re-abrir; rechazo de retiro excesivo con rollback; audit detecta drift del
  cache.
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 828/828, integration del WP
  4/4 + `finance-audit` 8/8.

## WP-GOALS-UI — Ritmo de ahorro + historial + subvistas  ·  P1  ·  **DONE (2026-09-05)**

- **Goal (spec 07 §6/§20/§21/§14):** mostrar ritmo/estado de una meta sólo con evidencia, más el
  historial de aportes; las subvistas activas/completadas ya existían.
- **`calculateGoalPace` (`@know-finanzas/finance/goals/goal-pace.ts`), pura:**
  - `GoalPaceStatus`: `NO_TARGET_DATE` / `INSUFFICIENT_DATA` / `GOAL_REACHED` / `DATE_PASSED` /
    `ON_TRACK` / `NEEDS_MORE` (§21 lista de estados, sin score opaco).
  - `requiredMonthly` / `requiredWeekly` = `remaining ÷ períodos restantes` (§20.2/20.3, `Money.split`).
  - `requiredBeforeDate` (lump sum) cuando quedan <30 días — no una división mensual absurda (§20.5).
  - `expectedProgressRatio = elapsed ÷ total` desde `goalStartOn` (min de primera allocation y
    createdAt) hasta `targetDate` (§21.1); tolerancia 0.05 para no flapear.
  - **Evidencia (§19.6):** el juicio ON_TRACK/NEEDS_MORE requiere `allocationCount ≥ 1`; antes es
    `INSUFFICIENT_DATA`. El rate forward-looking (§20) se muestra igual porque no depende de historia.
- **Servicio:** `goalAllocationRepository.aggregatesForUser()` (count + primera fecha por meta, una
  query agregada); `buildDetail` recibe esa evidencia y añade `pace: GoalPaceResult` a `GoalDetail`.
- **UI:**
  - `GOAL_PACE_META` (`goal-meta.ts`) — label + tone + `showChip` por estado.
  - `GoalRow` muestra el chip de ritmo en metas activas.
  - Detalle `/goals/[id]`: sección "Ritmo de ahorro" ("Cálculo orientativo", copy del §21.3
    "llevás X% y transcurrió Y% del tiempo") + sección "Historial" (`GoalHistory` — lista read-only
    de aportes/retiros con "no implica un movimiento en tus cuentas", §14.2).
  - Lista `/goals`: el `InsightCard` "Sugerencia" usa el rate real de `pace` en vez de un
    `remaining/30` naive.
- **Tests:** 7 unit (`finance-goal-pace.test.ts`) + 1 integration nuevo en `goal-allocations.test.ts`
  (evidencia → estado).
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 835/835 (+7), integration
  goals 5/5.

## WP-INSIGHT-DETECTORS — Motor de insights determinístico  ·  P1 · FINANCIAL  ·  **DONE (2026-09-05)**

Precedido por el spike `docs/implementation/12-insights-spike.md`. Alcance elegido por el usuario:
"núcleo + tabla + 3-4 detectores", incluye retirar el health score.

- **Núcleo puro (`packages/finance/src/insights/`):**
  - `types.ts`: `InsightFamily` (10 familias §21), `InsightStatus` (lifecycle §17), `InsightEvidence`
    (§9 — `sourceTypes/sourceIds/period/comparisonPeriod?/currency/metrics/sampleSize?/
    calculationVersion/dataQualityFlags/generatedAt`), `EvidenceSufficiency`, `InsightCandidate`.
  - `materiality.ts` `assessMateriality()` — umbral absoluto **y** relativo por familia (§23);
    el piso absoluto escala con el gasto mensual típico del usuario. Filtra "% grande sobre monto
    chico" y "% chico sobre monto grande".
  - `reconcile.ts` `reconcileInsights()` — puro: candidato nuevo → insert; candidato = fila abierta
    con mismo `dedupeKey` → update de copy sólo si cambió (supersede in place §18, nunca duplica);
    candidato = fila DISMISSED en cooldown → skip; pasado el cooldown → update + reactivate; fila
    abierta sin candidato → resolve. `DISMISS_COOLDOWN_DAYS` por familia (§8).
  - `priority.ts` `insightPriorityScore()`/`sortByPriority()` — urgencia por familia + impacto
    relativo + confianza; **no** un score opaco (§8).
- **Persistencia (`insights`, mig `0044_flat_steel_serpent.sql`):** `family`/`status`/`confidence`
  enums, `dedupeKey` (unique `(userId, dedupeKey)`), `evidence` jsonb, `calculationVersion`,
  `feedback` enum (§16), timestamps de lifecycle. `createInsightRepository`.
- **Detectores (`apps/web/src/features/insights/detectors.ts`):** `INS-BUDGET-LIMIT`
  (budget-service, NEAR_LIMIT/EXCEEDED vs % del mes), `INS-GOAL-PACE` (`calculateGoalPace` status
  NEEDS_MORE), `INS-CASH-RISK` (`calculateCashflow.firstNegativeDate` + materialidad, siempre
  etiquetado como proyección §26), `INS-DATA-QUALITY` (`countUncategorizedForUser ≥ 5`). Cada uno
  emite `InsightCandidate` con evidence.
- **Servicio (`insight-service.ts`, reescrito — se retiró el "Financial Health Score" que violaba
  D-07 y §2.3):** `refreshInsights()` (detectores → reconcile → upsert), `getQueue()` (cola abierta
  ordenada por prioridad), `getHistory()` (§13), `getDetail()` (marca SEEN), `dismiss()`/`resolve()`
  con feedback. Todos los repos se construyen desde `database` (no singletons — bug encontrado y
  corregido con el integration test).
- **UI:** `/insights` = cola de cards con "¿Por qué veo esto?" + acciones (Resuelto / Descartar con
  motivo §16); `/insights/[insightId]` = evidence package completo (fuentes, período, muestra,
  métricas, limitaciones); `/insights/history`. `emit-financial-event` gana `insight.updated`.
- **Tests:** 8 unit (`finance-insights.test.ts` — materialidad, reconcile incl. cooldown/supersede/
  insufficient, prioridad) + 3 integration (`insight-engine.test.ts` — persiste + dedupe en re-run,
  cooldown mantiene descartado fuera de la cola, resuelve cuando la condición desaparece).
- **No en alcance (follow-up):** las otras 6 familias de detectores (§21), cablear
  `explain-financial-insight` de IA como capa de copy (§20), recomputación por evento (hoy
  `getQueue` refresca on-demand).
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 843/843 (+8), integration
  del WP 3/3 + finance-audit/goal/budget sin regresión.

## WP-RULES-PREVIEW — Reglas personales: preview + retroactivo (spec 11 §6.8-6.10)  ·  P2  ·  **DONE (2026-09-05)**

- **§6.8 — simulación antes de guardar:** `classificationRuleService.previewRule(userId, ruleShape,
  {window})` → `{ eligibleCount, protectedByManual, alreadyInCategory, wouldChange, sample[] }`.
  El form (`rule-new-form.tsx`) gana un botón "Previsualizar" que muestra "recategorizaría N
  movimientos" + una muestra de hasta 8 filas, antes de guardar.
- **§6.9 — aplicación retroactiva explícita:** `<select>` NONE / LAST_30 / LAST_90 / ALL. Al crear
  la regla con una ventana ≠ NONE, `applyRuleRetroactively()` hace el bulk-update y devuelve el
  conteo; el form lo confirma ("se recategorizaron N movimientos anteriores").
- **§6.10 — la corrección manual gana:** tanto el preview como el apply excluyen filas con
  `classification.reviewedByUser = true` (contadas aparte como `protectedByManual`). El apply
  registra provenance `method: "user_rule", reviewedByUser: false` — una edición manual posterior
  vuelve a marcar `reviewedByUser: true` y la protege.
- **Query nueva** (`repositories/transactions.ts`): `listMatchingRulePatternForUser` (ILIKE
  escapado por modo CONTAINS/EQUALS/STARTS_WITH sobre `lower(merchant)` / `lower(description)`,
  POSTED, INCOME/EXPENSE, ventana opcional) + `applyRuleCategoryForUser` (bulk, resuelve
  `taxonomyNodeId` vía `categoryMap.resolveNodeForUserCategory`). `classification-rules` repo gana
  `findByIdForUser`.
- **Fuera de alcance (follow-up):** audit-log de creación/edición/aplicación retroactiva (§6.11).
- **Tests:** `tests/integration/rule-preview.test.ts` (2, Postgres real) — el preview cuenta bien
  (protegidas / ya-en-categoría / cambiarían) y el apply retroactivo no toca la corrección manual.
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 843/843, integration WP 2/2.

## WP-AI-WIRE — Cablear IA al flujo (spec 09 §19-20)  ·  P2  ·  **PARCIAL (2026-09-05)**

Alcance elegido: "explicación de insights con IA" (riesgo cero — no toca el ledger).

- **Nueva capability `insight.explain`** (`packages/ai/src/capabilities/insight-explanation/`):
  `explainInsight(provider, {family, title, body, evidence})` → `{ explanation, caveats? }`. Un
  solo `generateStructured` role FAST, sin tools, sin loop. El prompt (`buildInsightExplanationPrompt`)
  ordena: usar SÓLO el evidence package, nunca recomputar/inventar un número, nunca contradecir el
  `body`, describir toda proyección como proyección, 2-4 oraciones, sin consejo financiero.
  Registrada en `AI_CAPABILITIES` + `CREDIT_COSTS` (2) + `capability-entitlement-map` (`ai.assistant`).
- **Wiring app:** `lib/ai/explain-insight.instance.ts` `explainInsightWithAI()` pasa por
  `executeAICapability` (acceso → entitlement → costo → rate-limit → reserve → execute →
  commit/release → telemetría — mismas invariantes que las otras capabilities). Nueva action
  `explainInsightAction` en `insight-actions.ts` (operationId con `randomUUID` para no chocar con
  la deduplicación de créditos entre clicks).
- **UI (`/insights/[id]`):** `InsightExplain` — botón "Explicar con IA"; al éxito muestra la
  explicación en una card marcada "generada con IA · basada en la evidencia de arriba"; al fallo
  muestra el motivo y aclara que la evidencia sigue disponible. **Fallback determinístico:** el
  `body` del insight y el evidence package se renderizan siempre, con o sin IA (spec §20 "si falla
  el LLM, usar plantilla determinística" — acá la plantilla es lo que ya está en pantalla).
- **Fuera de alcance (follow-up):** `transaction.categorize` / `merchant.normalize` como sugerencia
  (nunca auto-aplicada) en la cola de `/transactions/pending`.
- **Tests:** 2 unit (`ai-insight-explanation.test.ts` — el prompt prohíbe recomputar y no
  contradice el body; `explainInsight` hace un solo call FAST). El test existente "cada capability
  tiene costo estable" ahora cubre `insight.explain`.
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 845/845 (+2).

## WP-HELP-MODULE — Módulo 12 "Ayuda" (spec 12)  ·  P2  ·  **PARCIAL (2026-09-05)**

El módulo estaba MISSING por completo. Alcance elegido: hub + getting-started + troubleshoot con
el diagnóstico de saldo.

- **`/help` (§6):** hub navegable (`HelpShell` con nav lateral — spec §2.3, NUNCA submenú del
  sidebar §2.4) + 3 artículos FAQ estáticos (dinero disponible, pago de deuda ≠ gasto, multimoneda).
- **`/help/getting-started` (§9):** checklist de 7 pasos cuyo `done` se computa del **estado real**
  (`help-diagnostics.ts` `gettingStartedState` — cuentas/movimientos/gastos categorizados/deudas/
  presupuestos/metas), no de "eventos" trackeados. Sin gamificación. Glosario de una línea (§9.5).
- **`/help/troubleshoot` (§10):** árbol de problemas (§10.2) + el **diagnóstico de saldo read-only**
  (§11): `helpService.diagnoseBalance()` sobre `createHelpDiagnosticQueries.balanceSignals` detecta
  — movimientos sin categoría, importaciones con filas salteadas/con error, ajustes de saldo
  recientes, movimientos con fecha futura, anulados recientes, cuentas multimoneda — y devuelve
  "encontramos N posibles causas" con un CTA por causa. **Nunca ejecuta una corrección** (§11.4);
  cada query es un aggregate targeted, cero mutación.
- **`/help/{status,contact,about}`:** páginas honestas mínimas — status muestra el principio de
  degradación §15.4; contact da el canal directo + qué incluir; about lista los invariantes
  financieros en lenguaje de usuario.
- **Nav:** link "Ayuda y soporte" en el `UserMenu` (dropdown), no en el sidebar.
- **Fuera de alcance (follow-up):** diagnósticos de presupuesto/obligaciones/proyección (§12-14),
  `/help/feedback`, formulario de contacto con backend, búsqueda (§6.4), artículos con CMS/versionado.
- **Tests:** `tests/integration/help-balance-diagnostic.test.ts` (2, Postgres real) — detecta las
  señales y **no muta ninguna transacción**.
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 845/845, integration WP 2/2.

## WP-SETTINGS-MISSING — Rutas canónicas de Configuración (spec 11 §3/§4/§17)  ·  P2  ·  **PARCIAL (2026-09-06)**

- **`/settings` (hub):** una página que agrupa todas las secciones (Perfil, Preferencias, Privacidad,
  Suscripción, Categorías, Reglas, Importaciones, Notificaciones, Referidos). Link "Ver todo" +
  Perfil/Preferencias agregados al `UserMenu`.
- **`/settings/profile` (§3):** form real sobre `userRepository.updateBasicProfile` — nombre visible,
  país, zona horaria, idioma, **moneda base de presentación** (con el copy §3.6: "sólo la moneda en
  la que se muestran los totales — NO convierte ni combina monedas"). Email read-only (cambiarlo es
  un flujo aparte §3.3, follow-up). Zona horaria con la aclaración §3.5 (no reinterpreta fechas
  históricas).
- **`/settings/preferences` (§4):** tabla nueva `user_preferences` (mig `0045_ordinary_tomas.sql`) —
  `theme` (SYSTEM/LIGHT/DARK), `defaultReportPeriod`, `weekStartsOn` (0|1, con check), `showCents`,
  `compactLargeNumbers`, `rememberLastAccount`, `rememberLastCategory`, `captureMode` (QUICK/FULL).
  `createUserPreferencesRepository` (`getForUser` devuelve `DEFAULT_USER_PREFERENCES` si no hay fila,
  `upsert` mergea). **Ninguna preferencia puede romper un invariante** (§4.3) — un test verifica que
  ninguna clave contiene "transfer/income/available/currency/balance/sum".
- **Fuera de alcance (follow-up):** `/settings/security` (sesiones + revocar-otras + cambio de
  contraseña vía better-auth), cambio de email verificado (§3.3), y **cablear las preferencias a la
  UI** (hoy se persisten pero `theme`/`defaultReportPeriod`/`showCents` todavía no se consumen — el
  app no tiene theme provider y `DateSelector` es month-only).
- **Tests:** `tests/integration/user-preferences.test.ts` (3, Postgres real) — defaults + upsert
  parcial + `updateBasicProfile` + la regla §4.3.
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 845/845, integration WP 3/3.

## WP-SHELL-PALETTE — Command palette (spec 13 §15, PD-012)  ·  P2  ·  **DONE (2026-09-06)**

- **`CommandPalette` + `CommandPaletteRoot`** (`features/shell/components/`): montado una vez en
  `app-shell.tsx`, es dueño del shortcut `Cmd/Ctrl+K` (§15.2). `Cmd+K` **dejó de abrir Quick Add** —
  eso ahora es sólo `N`; se sacó el handler de `quick-add-root.tsx`.
- **Sólo acciones seguras (§15.5, PD-012 "el command palette nunca muta"):**
  - "Ir a": todas las rutas de `NAV_ITEMS` + sus `children` + `/settings/*` + `/help/*`. `router.push`.
  - "Registrar un movimiento": dispara `openQuickAdd()` (abre el diálogo, no crea nada).
  - Estructuralmente no hay ningún `onSelect` que llame a una acción de escritura.
- **Búsqueda de entidad degradable (§15.3, §2771):** al tipear ≥2 chars, debounce 220ms →
  `searchEntitiesAction(query)` (server action, `requireCurrentUser` + `transactionRepository
  .searchForUser` con ILIKE escapado sobre `description`/`merchant`, POSTED, ownership en origen
  §22/§3596). Resultados linkean a `/transactions/[id]`. Si la acción falla → mensaje "búsqueda no
  disponible, navegá a Transacciones" y la paleta sigue usable para navegar.
- `Command` con `shouldFilter={false}` — el filtrado de destinos es propio; cmdk sólo maneja la
  navegación por teclado. Footer que dice explícitamente "sólo navega e inicia flujos — nunca
  modifica tus datos".
- **Tests:** `tests/integration/command-palette-search.test.ts` (3, Postgres real) — matchea los
  movimientos propios por descripción/comercio, **nunca** los de otro usuario, ignora queries de
  <2 chars.
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 845/845, integration WP 3/3.

## WP-SHELL-403 — 404/403 no filtran existencia (spec 13 §8.1 / §26)  ·  P2 · SECURITY  ·  **DONE (2026-09-06)**

- **Principio (§8.1):** una ruta de recurso responde igual a "no existe", "no es tuyo" y "id
  malformado" — un 404 plano, nunca un 403 (que confirmaría que el recurso existe) ni un 500.
- **`resourceIdOr404(id)`** (`apps/web/src/lib/http/resource-id.ts`): valida que el param sea un
  UUID; si no, `notFound()`. Las 8 páginas de detalle lo llaman sobre el param crudo ANTES de
  tocar cualquier servicio, así que `/transactions/xxx` rinde 404 en vez de un error de Postgres
  (`invalid input syntax for type uuid`).
- **Aplicado a:** `accounts/[accountId]`, `budgets/[budgetId]`, `goals/[goalId]` (+ `/edit`),
  `transactions/[transactionId]`, `transactions/transfers/[transferId]`, `insights/[insightId]`,
  `obligations/[obligationId]`. Todas ya caían en `notFound()` para "no encontrado" vía el catch
  de `*_NOT_FOUND` / `INVALID_INPUT` (que los servicios lanzan igual para no-existe y no-tuyo).
- **Bug corregido de paso:** `/obligations/[obligationId]/page.tsx` destructuraba `params.debtId`
  (nombre del segmento antiguo, `undefined` tras WP-ROUTES-RENAME) → `getDebtDetail(user, undefined)`
  → toda página de obligación daba 404. Ahora lee `obligationId`.
- **`not-found.tsx`** ya es genérico ("Esta página no existe") — no filtra qué recurso faltaba.
- **Tests:** `tests/unit/resource-id-or-404.test.ts` (2 — UUID válido pasa; malformado/vacío/
  inyección → 404) + un caso nuevo en `security-idor-and-concurrency.test.ts` (el detalle de
  obligación rechaza la deuda de otro user con la MISMA forma que una inexistente → misma 404).
- **Verificación:** lint web limpio, typecheck 148/148 (0 nuevos), unit 847/847 (+2). Fase G
  cerrada (4/4).

## WP-E2E-JOURNEYS — Journeys financieros críticos end-to-end (spec 14 §39.3)  ·  P1 · FINANCIAL  ·  **DONE (2026-09-06)**

- **`tests/e2e/journeys.spec.ts`** (3 tests, todos verdes) — recorren la UI real con IA
  deshabilitada (`AI_ENABLED=false`), así prueban que el núcleo funciona sin IA:
  1. *Registrar un gasto se refleja en el saldo total* — cuenta con apertura + gasto vía
     `/transactions/new` → redirect a `/transactions`, el movimiento en el ledger, y el saldo
     total del dashboard = apertura − gasto (no scoping por período).
  2. *Transferencia entre cuentas propias* — `/transactions/transfers/new` mueve ambos saldos
     (origen −monto, destino +monto) y **no** aparece como ingreso/gasto en `/transactions` (§10).
  3. *Aporte a una meta* — dialog "Registrar ahorro" → progreso derivado (25%) + fila "Aporte"
     en el historial (WP-GOALS-ALLOC).
- **3 bugs de producción encontrados (vía `final-route-regression` con la lista de rutas ampliada)
  y arreglados — todos rompían para usuarios reales:**
  1. **Fecha "hoy" rechazada como futura.** `create-transaction` y `transfer-actions` construían
     `occurredAt` como `` `${date}T12:00:00Z` ``. El servicio rechaza `occurredAt > now`
     (`INVALID_INPUT` field `occurredAt`) → **todo gasto/ingreso/transferencia con fecha hoy fallaba
     cada mañana antes de las 12:00 UTC** y siempre al este de UTC. Nuevo
     **`resolveOccurredAtISO(date, timeZone)`** en `apps/web/src/lib/date.ts`: instante actual si
     la fecha es hoy en el huso del usuario; mediodía-UTC estable si es pasada.
  2. **`/obligations/upcoming` = página de error.** `getLiquidTotalsForUser`
     (`packages/db/src/queries/account-balances.ts`) selecciona las columnas de
     `buildLedgerTotalColumns()` dentro de un subquery y luego las referencia por nombre → drizzle
     lanza *"raw SQL field … doesn't have an alias declared"*. Nuevo
     **`buildAliasedLedgerTotalColumns()`** en `ledger-totals.ts`. Era el único consumidor, sin
     test — roto desde WP-LEDGER-EXHAUSTIVE.
  3. **`/reports/*` = página de error.** `periodLabel`/`compactTotal`/`toSegments` vivían en
     `report-shared.tsx` (`"use client"`); llamarlas desde un server component lanza *"Attempted to
     call periodLabel() from the server"*. Movidas a **`report-format.ts`** (módulo plano); las 6
     páginas de `/reports` reimportan de ahí.
- **Tests:** +2 unit en `date-utility.test.ts` (hoy → instante en `[before, after]`; pasada →
  `T12:00:00Z` estable) + 1 integration en `transfer-balance.test.ts` (`getLiquidTotalsForUser`
  devuelve el total con transferencias, sin el error de alias).
- **Infra E2E:** 17 specs muertos ya en `tests/e2e-quarantine/`; `playwright.config.ts` carga
  `.env`; `signUpCompleteOnboardingAndStartTrial` = `signUp` + `goto('/app')` (gate de
  onboarding removido en el rebuild greenfield); `final-route-regression.spec.ts` con la lista
  de rutas canónicas actualizada.
- **Journeys §39.3 restantes** (import con errores, duplicado, downgrade sin pérdida, IA caída)
  tienen cobertura a nivel integración/unit; se agregan como E2E cuando se reconstruya cada
  subsistema (import UI, billing UI, IA cableada).
- **Verificación:** lint web limpio · typecheck 0 · unit 849/849 (+2) · integración balances 26/26
  (+1) · e2e viva 6/6. Commit `34fddfc`.

## WP-SECURITY-SUITE — Suite de seguridad G2 (spec 14 §39.4)  ·  P1 · SECURITY  ·  **DONE (2026-09-06)**

- **Alcance elegido con el usuario:** cerrar el riesgo concreto de integridad financiera (IDOR en
  los dominios que la suite no tocaba) y **documentar** por qué el resto de G2 no es accionable
  hoy o dónde ya queda cubierto — no inflar con tests de garantías del framework.
- **`tests/integration/security-idor-and-concurrency.test.ts` — de 6 a 13 tests.** Nuevo bloque
  "los dominios agregados después del rebuild son ownership-scoped":
  - **Metas + `goal_allocations`:** `contribute`/`withdraw`/`getGoalDetail`/`listAllocations`/
    `archiveGoal` sobre meta ajena → `GOAL_NOT_FOUND`; el `currentAmount` de la víctima nunca se
    mueve. Además: rechazo de meta ajena = misma forma que meta inexistente (§8.1).
  - **Reglas de clasificación:** `applyRuleRetroactively`/`previewExistingRule`/`deleteRule`
    sobre regla ajena → `RULE_NOT_FOUND`; un apply retroactivo propio nunca recategoriza filas de
    otro usuario (el bulk update es `userId`-scoped en el repo).
  - **Insights:** `getDetail` nunca devuelve el insight ajeno; `dismiss`/`resolve` no cambian su
    estado (WHERE con `and(eq(id), eq(userId))` → 0 filas actualizadas).
  - **Editar/anular transacción:** `editTransaction`/`voidTransaction` sobre txn ajena →
    `TRANSACTION_NOT_FOUND`; la fila queda intacta.
  - **Import CSV:** `commitImport` a cuenta ajena → `ACCOUNT_NOT_FOUND`, cero transacciones
    escritas (ni para el atacante ni para la víctima).
- **`docs/implementation/13-security-g2-coverage.md`** (nuevo): tabla de qué cubre la suite IDOR +
  por qué CSV-export (no existe ninguna ruta de export en la app), XSS (React escapa; 0
  `dangerouslySetInnerHTML` en `apps/web/src`), CSRF (better-auth valida Origin/Referer + Server
  Actions rechazan cross-origin), rate limits (`executeAICapability` + tests de `packages/ai`),
  session (better-auth), webhook spoofing (`packages/billing`) y escalación admin (subsistema
  borrado en el rebuild) no son gaps accionables hoy. Follow-ups listados ahí.
- **Verificación:** lint web limpio · typecheck 0 · unit 849/849 · integración 197/197 (+7, 1 skip).

## WP-RECONCILIATION — Gate G1: el ledger reconcilia entero  ·  P1 · FINANCIAL  ·  **DONE (2026-09-06)**

- **`tests/integration/finance-reconciliation.test.ts`** (3 tests). Los WPs anteriores prueban una
  invariante cada uno en aislamiento; esto prueba que **todo el sistema reconcilia a la vez**:
  - Un dataset que toca **cada dominio que `finance:audit` valida** (transferencias, pagos de deuda
    + allocations, cuotas, ownership/moneda de transacción, links de programadas, cache de meta)
    construido **a través de los servicios reales** — `createTransactionService`,
    `createTransferService`, `createDebtPaymentService`, `createGoalService` — no filas insertadas
    a mano. `runFinanceAudit(database).findings` debe ser `[]`, y `scannedCounts` confirma que el
    dataset efectivamente ejercitó cada dominio (una auditoría silenciosa sobre una DB vacía no
    prueba nada).
  - Sigue reconciliado tras `voidForUser` de una transacción y `voidTransfer` de una transferencia
    (ambas patas pasan a VOIDED juntas).
  - El cache `goals.current_amount` == Σ firmada de allocations, a la escala de la moneda.
  - Si algún servicio empieza a escribir un valor derivado/cacheado que deriva de su fuente, este
    test se pone rojo.
- **`finance-audit.test.ts` 8 → 11 tests.** Cubre las clases de corrupción que faltaban:
  scheduled POSTED linkeada a una transacción de otro usuario; transacción con categoría de otro
  usuario; goal allocation con moneda ≠ la de su meta.
- **`finance-money.test.ts` 12 → 18 tests.** Cierra la superficie de `Money`: `zero()` como
  identidad aditiva, `equals` currency-aware y value-exact (no redondea), redondeo HALF_UP
  simétrico en negativos (`-2.005 → -2.01`), normalización de `+1.5` / `"  1.5  "` / `.5`, split de
  JPY (0 decimales) en unidades enteras, y las guardas de `split` (parts 0 / no entero / Money
  negativo). Todas las aserciones pasaron sin tocar `Money` — confirma el comportamiento, no lo
  cambia.
- **Verificación:** lint web limpio · typecheck 0 · unit 856/856 (+6) · integración 203/203 (+6, 1 skip).

## WP-A11Y — Gate G4: flujos críticos operables por teclado + screen reader  ·  P1  ·  **DONE (2026-09-06)**

- **Fix real encontrado:** no había **skip link**. Con una sidebar llena de links de navegación
  antes de `<main>`, un usuario de teclado tenía que tabular por toda la nav en cada página
  (WCAG 2.4.1 Bypass Blocks). Agregado a `AppShell` como primer elemento focusable —
  `sr-only` hasta recibir foco, luego visible arriba-izquierda; apunta a `#main-content`
  (`<main tabIndex={-1}>`). Además: el `sr-only` del botón de cerrar en `dialog.tsx` y `sheet.tsx`
  decía "Close" (inglés) → "Cerrar".
- **`tests/e2e/a11y-keyboard.spec.ts`** (5 tests, manejan interacción de teclado real, no sólo
  estructura):
  1. El skip link es el primer tab stop; activarlo mueve el foco a `#main-content` (el siguiente
     Tab ya está dentro del contenido, no en la sidebar).
  2. La paleta de comandos es 100% teclado: `Ctrl+K` abre y enfoca el input, `ArrowDown` + `Enter`
     navega, reabrir + `Escape` cierra sin perder el foco.
  3. Un movimiento se registra sólo con teclado (focus + `keyboard.type` + `Tab` entre campos +
     `Enter` en el botón) y aterriza en `/transactions`.
  4. Un form con campo `required` vacío bloquea el submit (no navega) y el navegador mueve el foco
     al campo inválido — un lector de pantalla sabe exactamente qué corregir.
  5. Un diálogo (aporte a meta) atrapa el foco (Tab nunca escapa al fondo) y lo **restaura al
     botón trigger** al presionar `Escape`.
- Los contratos estructurales de a11y (un `<h1>` por ruta, controles etiquetados, landmarks,
  un control focusable) ya los cubren `final-route-regression.spec.ts` (desktop + mobile) y
  `final-accessibility-audit.spec.ts` — no se duplican aquí.
- **Follow-ups (no bloquean G4):** auditoría con axe-core por ruta; `aria-live` explícito en los
  toasts con undo; foco al `<h1>` en navegación SPA (Next App Router ya trae un route announcer);
  revisar contraste de tokens en tema oscuro.
- **Verificación:** lint web limpio · typecheck 0 · unit 856/856 · e2e 11/11.

## WP-DEGRADED — Gate G5: modo degradado de subsistemas no esenciales  ·  P1 · FINANCIAL  ·  **DONE (2026-09-06)**

- **`docs/implementation/14-degraded-mode.md`** (nuevo): la matriz completa — para IA, analytics,
  notificaciones, invalidación de caché, búsqueda de la paleta y refresh de insights: cómo falla,
  qué pasa con el núcleo financiero, y dónde se prueba el contrato.
- **Prueba viva más fuerte (ya existía):** toda la suite E2E (`tests/e2e/`, 11 tests) corre con
  `AI_ENABLED=false` y `BILLING_ENABLED=false` — registrar gasto / transferir / aportar a meta
  pasan end-to-end sin una sola llamada de IA ni billing.
- **Hardening:** `emitFinancialEvent` ahora envuelve cada `revalidate(path)` en `try/catch`. Las
  acciones lo llaman **después** de que la escritura financiera commiteó, así que una falla de
  `revalidatePath` no puede convertir una escritura exitosa en una respuesta de error (peor caso:
  una superficie muestra datos algo viejos hasta la próxima navegación).
- **Tests nuevos:**
  - `tests/unit/map-ai-error.test.ts` (4): los 14 `AIErrorCode` mapean a un mensaje legible, nunca
    lanzan, nunca filtran el código crudo; `AI_DISABLED`/`AI_PROVIDER_ERROR` se redactan como
    disponibilidad, no error del usuario; un error desconocido → `INTERNAL_ERROR`, nunca throw.
  - `tests/unit/emit-financial-event.test.ts` +1: una falla de revalidación se traga y el resto de
    los paths se siguen intentando.
  - `tests/integration/insight-engine.test.ts` +2: los insights se detectan/encolan/detallan
    completos (title, body, evidence) **sin IA en el path**; `getQueue` envuelve su propio refresh
    (`refreshInsights().catch(() => undefined)`) → nunca rompe la página.
- **Ya cubierto en otro lado (documentado, no re-testeado):** `createAnalyticsService.track()`
  nunca lanza (`analytics-service` unit); un fallo de envío de email/WhatsApp deja el delivery
  `FAILED` sin tocar la fila de notificación (`email-delivery` / `whatsapp-delivery` integ);
  `searchEntitiesAction` degradable (`command-palette-search` integ).
- **Follow-ups:** E2E de "budget excedido → notificación falla → transacción igual posteada" al
  reconstruir el subsistema de alertas; E2E de rate-limit del asistente con `AI_ENABLED=true`;
  envolver el tope de `notifyUser` en try/catch.
- **Verificación:** lint web limpio · typecheck 0 · unit 861/861 (+5) · integración 205/205 (+2) ·
  e2e 11/11.

## WP-OBSERVABILITY — Gate G7: logs estructurados + señales de seguridad  ·  P1 · SECURITY  ·  **DONE (2026-09-06)**

- **`packages/observability/src/security-signals.ts`** (nuevo): `OWNERSHIP_LOOKUP_ERROR_CODES`
  (los códigos de `ApplicationError` que un servicio lanza cuando un lookup ownership-scoped falla
  para un ID que puso el usuario) + `isOwnershipLookupError(code)` + `SECURITY_EVENT` (nombres de
  evento estables). Set de strings en un paquete sin dependencias; un test lo ata al union real de
  `ApplicationErrorCode`.
- **`apps/web/src/lib/observability/observe-action.ts`** (nuevo): `reportActionError(action, userId, error)`:
  - error de lookup ownership-scoped → `logger.warn("security.ownership_lookup_failed", {action, code, userId, field})`.
    Individualmente casi siempre benigno; **un pico desde un `userId` = enumeración de IDs / IDOR
    probing** (§8.1 hace que "no es tuyo" y "no existe" respondan igual — este log es el único lugar
    donde se ve la diferencia).
  - error que **no** es `ApplicationError` → `logger.error("action.unexpected_error", …)` — el
    "error crítico" que se pagea al instante.
  - rechazo de dominio esperado → `logger.info("action.rejected", …)` — ruido normal, sirve para
    tasas de fricción.
  - Nunca cambia el error (el caller lo mapea/re-lanza igual), nunca lanza, nunca loguea texto del
    usuario (sólo IDs y códigos; `redactFields` es el backstop).
- **Cableado** en el `catch` de 13 acciones financieras: `transaction.{create,edit,void}`,
  `transfer.{create,void}`, `obligation.{create,payment,cancel}`,
  `goal.{create,contribute,withdraw,update,archive}`. Patrón: `let userId` hoisted, `userId = user.id`
  tras `requireCurrentUser()`, `reportActionError(name, userId, error)` en el catch.
- **`docs/implementation/15-observability.md`** (nuevo): catálogo de eventos de log, tabla de
  reglas de alerta recomendadas (ratios/umbrales para el agregador), y specs de los 5 dashboards
  mínimos de V1 (config deploy-time, no código).
- **Tests:** `tests/unit/security-signals.test.ts` (4 — clasificador + el list vs el union real),
  `tests/unit/observe-action.test.ts` (4 — warn/info/error correctos, nunca filtra contenido,
  nunca lanza).
- **Follow-ups (no bloquean G7):** propagar `requestId` a los logs de acciones (falta
  AsyncLocalStorage en Server Actions); instrumentar import/reglas/cuentas/presupuestos/insights;
  un cron que corra `runFinanceAudit` y emita `finance_audit_completed`.
- **Verificación:** lint web limpio · typecheck 0 · unit 869/869 (+8) · integración 205/205 ·
  e2e 11/11.

## WP-DEPLOY — Artefacto de deploy + CI verde  ·  P1  ·  **CÓDIGO DONE (2026-09-06); provisioning = usuario**

Alcance elegido con el usuario: "CI en Actions + artefacto de deploy + checklist" (no toca infra real).

- **Bug de CI corregido (bloqueante):** `ci.yml` corre `pnpm test`, que usa `vitest.config.ts`
  (raíz) con `include: tests/**/*.test.ts`. Eso levantaba los 10 archivos de `tests/quarantine/`
  (parkeados en WP-B8-RECONCILE, importan app-layer borrado) → no colectan → CI roja. Nadie había
  corrido `pnpm test` a secas desde el rebuild. Fix: `exclude` ahora incluye `tests/quarantine/**`
  (las configs `unit`/`integration` ya lo evitaban por scope). `pnpm test` → 177 archivos / 1074
  tests verde.
- **Bug del Dockerfile:** el `deps` stage COPYea el `package.json` de cada workspace para cachear
  el `pnpm install`, pero faltaba `packages/observability` (agregado después del Dockerfile) → el
  install fallaría al no resolver el workspace link. Agregado.
- **`railway.toml`:** apuntaba a `docs/deployment-runbook.md` (borrado en el rebuild). Corregido a
  `docs/implementation/16-deploy-runbook.md`.
- **`docs/implementation/16-deploy-runbook.md` (nuevo):** qué ya está hecho (CI, Dockerfile
  multi-stage standalone, `railway.toml`, health checks `/live` `/` `/deep`, `assertProductionHardening`);
  tabla de env vars requeridas (con cómo generarlas) y opcionales por capability; pasos exactos de
  primer deploy (provisionar → secrets → `pnpm db:migrate` una vez → deploy → verificar 3 health
  checks + journey a mano → DNS) y de cada deploy siguiente (migración manual antes de promover,
  smoke test, `finance:audit` post-deploy con rollback si `findings ≠ []`); URLs y secretos de los
  3 webhooks; enganche con las alertas de `15-observability.md`.
- **Ya estaba y sigue válido (verificado):** `ci.yml` (lint/typecheck/drift de migración/migrate/
  test/build/e2e + dependency-review), `Dockerfile`, `railway.toml`, `.dockerignore`,
  `apps/web/src/instrumentation.ts` (hardening en runtime), las 3 rutas de health. Los 15
  paquetes del repo coinciden con `packages/config` y (ya) con el Dockerfile.
- **Pendiente (sólo el usuario puede):** cuenta Railway + plugin Postgres, cargar los secrets,
  correr `pnpm db:migrate` contra la DB de producción, apuntar DNS + `BETTER_AUTH_URL`, credenciales
  productivas de Mercado Pago y config de sus webhooks.
- **Verificación:** lint web limpio · typecheck 0 · `pnpm test` (unit+integración combinado, que es
  lo que corre CI) 177/177 archivos, 1074 tests, 1 skip · e2e 11/11.

## WP-SHELL-SIDEBAR — Application Shell: sidebar + menú de cuenta (spec 13 §5–6, §18)  ·  P1  ·  **DONE (2026-09-06)**

Primer incremento de Fase I (reconstrucción de UI contra `docs/visual/`).

- **§6.2 orden V1** — confirmado (Resumen · Cuentas · Transacciones · Presupuestos · Obligaciones ·
  Calendario · Metas · Reportes · Insights). Nuevo `SECONDARY_NAV_ITEMS` (`Configuración`, `Ayuda`)
  renderizado **como items del sidebar** bajo un `<hr>` separador (§6.2 "Abajo:", §6.16). Antes sólo
  vivían en el dropdown de cuenta.
- **§6.13–6.14 badges accionables** — `NavBadgeKey` (`transactions-pending` | `insights-unseen`) en
  `nav-items.ts`; `SidebarNav` recibe `badges` y pinta un pill (1–99, luego `99+`, nunca en 0) con
  `aria-label`. `(app)/layout.tsx` resuelve dos `COUNT(*)` baratos por navegación:
  `transactionRepository.countUncategorizedForUser` (gastos sin categoría) y el nuevo
  `insightRepository.countActiveForUser` (insights ACTIVE = nuevos, dejan de contar al verse).
- **§3.3 navegación ≠ acción** — eliminado el botón fantasma "Sincronizar cuentas" del sidebar
  (no tenía handler; no existe la feature).
- **§18.2 menú de cuenta** — reducido a `nombre/email` → `Configuración` · `Plan` · `Ayuda` →
  `Cerrar sesión`. Antes tenía "Ver todo" + 8 sub-links de settings + "Ayuda y soporte" (violaba
  §18.3 "no oversized link lists"). La superficie completa de settings vive en el hub `/settings`.
- **§6.16 zona de cuenta** — el `UserMenu` queda en su propia región con `border-t`, separada de la
  navegación.
- Tests: `tests/e2e/shell.spec.ts` (nuevo, 2 — orden V1 + Config/Ayuda bajo separador + sin botón
  fantasma; el badge de Transacciones cuenta lo que necesita revisión) + `insight-engine.test.ts`
  +1 (`countActiveForUser` baja al ver/descartar).
- **Verificación:** lint web limpio · typecheck 0 · unit 869/869 · integración 206/206 · e2e 13/13.
- **Follow-ups (Fase I):** WP-SHELL-HEADER (§9–10, §17 centro de notificaciones), WP-SHELL-COLLAPSE
  (§6.10–6.12 colapso a iconos), WP-SHELL-OVERLAYS, WP-SHELL-STATES.

## WP-SHELL-HEADER — App header + centro de notificaciones (spec 13 §9, §17)  ·  P1  ·  **DONE (2026-09-06)**

Segundo incremento de Fase I.

- **§9 App header desktop** (`components/layout/app-header.tsx`, `hidden lg:flex`, sticky): sólo
  acciones **globales** (§9.3 — nada de filtros/KPIs/tabs de página). `CommandPaletteTrigger`
  ("Buscar · ⌘K" → abre la paleta) a la izquierda, campana de notificaciones a la derecha.
- **§9.4 separación app/page**: `HeaderActions` (que vive en el `PageHeader` de cada pantalla)
  perdió su campana — ahora sólo el selector de período. La campana era global y estaba repetida
  en cada page header.
- **§17 Centro de notificaciones real** — `/notifications` dejó de ser `RebuildingNotice`:
  - `features/notifications/services/notification-service.ts` — `getInbox` (ordena por §17.4:
    seguridad → riesgo financiero → billing que afecta acceso → recordatorios → sistema →
    producto; `notification-priority.ts` calcula el rank, los tipos DEBT_DUE_SOON/
    SCHEDULED_TRANSACTION_DUE bajan a "recordatorio" aunque su categoría sea FINANCIAL),
    `markRead`, `markAllRead`.
  - `notification-copy.ts` — título + cuerpo in-app por `notificationType` (28 tipos, exhaustivo),
    separado a propósito del copy de email de `packages/notifications` (sin capa i18n compartida).
  - `NotificationCenter` (client) — marca leído al abrir + navega al deep-link (§17.7), botón
    "Marcar todas como leídas" (§17.8), empty state "No tenés notificaciones nuevas" sin
    gamificación (§17.11), hora relativa (`relativeTimeAgo` nuevo en `lib/format`) con la fecha
    exacta en `title`/`<time>` al hover (§17.10). Leído ≠ resuelto (§17.6 — nunca toca el evento
    de dominio; el test lo prueba).
  - `notification-actions.ts` — `markNotificationReadAction` (un `NOTIFICATION_NOT_FOUND` es un
    no-op exitoso), `markAllNotificationsReadAction`. `notification.updated` agregado a
    `emitFinancialEvent` (revalida `/notifications` + `/app` para el badge del layout).
- **Tests:** `tests/integration/notification-center.test.ts` (5 — orden §17.4, deep-link, IDOR,
  markRead no toca el dominio, markAll) + `shell.spec.ts` +2 (el app header tiene búsqueda +
  campana, `/notifications` renderiza su centro; ninguna página repite la campana).
- **Verificación:** lint web limpio · typecheck 0 · unit 869/869 · integración 211/211 (+5) ·
  e2e 15/15.
- **Follow-up inmediato:** WP-SHELL-BREADCRUMBS (§10).

## Fases C–H (restante)

Ver `09-implementation-roadmap.md`. Cada WP ahí listado se desglosa a este formato al comenzar su fase.
Ninguno arranca antes de que su dependencia esté `DONE` (regla `tasks/README.md`). Próximo en Fase C:
WP-DASHBOARD-SPEC01 (deferido explícitamente por tamaño — pendiente de decisión del usuario sobre
cuándo retomarlo).

## Primer vertical slice recomendado

~~WP-000~~ (hecho) → **WP-IMPL-ADR-001 → WP-LEDGER-IDEMP → WP-ANTI-DOUBLE-COUNT.**
Justificación en el resumen de checkpoint (sección E).
